// src/app/features/editor/model-editor.component.ts
import { Component, type OnDestroy, type OnInit, ViewChild, type ElementRef, inject, signal, effect, runInInjectionContext, EnvironmentInjector } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule, type FormArray, FormBuilder, Validators } from "@angular/forms"
import * as go from "gojs"
import debounce from "lodash-es/debounce"
import { ModelsApiService } from "../../core/services/models-api"
import { ActivatedRoute } from "@angular/router"
import { HeaderComponent } from "../../shared/components/header/header"
import { CardComponent } from "../../shared/components/card/card"
import { FormFieldComponent } from "../../shared/components/form-field/form-field"
import { RealtimeService } from "../../core/services/realtime"


type EntityAttr = { name: string; type: string; pk?: boolean; unique?: boolean; nullable?: boolean }
type Entity = { name: string; stereotype?: string; attrs: EntityAttr[] }
type Relation = {
  from: string
  to: string
  kind: "association" | "aggregation" | "composition"
  fromCard?: string
  toCard?: string
}
type DSL = { entities: Entity[]; relations: Relation[]; constraints?: any[] }

@Component({
  selector: "app-model-editor",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, CardComponent, FormFieldComponent],
  templateUrl: "./editor.html",
  styleUrl: "./editor.scss",
})
export class ModelEditorComponent implements OnInit, OnDestroy {
  @ViewChild("diagramDiv", { static: true }) diagramRef!: ElementRef<HTMLDivElement>
  private route = inject(ActivatedRoute)
  private api = inject(ModelsApiService)
  private fb = inject(FormBuilder)

  private diagram!: go.Diagram
  private modelChangedListener?: (e: go.ChangedEvent) => void
  private selectionChangedHandler?: (e: go.DiagramEvent) => void
  private linkDrawnHandler?: (e: go.DiagramEvent) => void

  projectId = signal<string>("")
  branchId = signal<string | undefined>(undefined)
  status = signal<string>("Listo")
  selectedType = signal<"node" | "link" | null>(null)
  private selectedNodeData?: any
  private selectedLinkData?: any

  constructor(private realtime: RealtimeService) { }

  private remoteOff?: () => void;
  private applyingRemote = false;
  private env = inject(EnvironmentInjector);

  
  // Forms
  nodeForm = this.fb.group({
    name: ["", Validators.required],
    stereotype: [""],
    attrs: this.fb.array(this.makeAttrArray([])),
  })
  linkForm = this.fb.group({
    kind: ["association", Validators.required],
    fromCard: ["N"],
    toCard: ["1"],
  })

  ngOnInit() {
    this.projectId.set(this.route.snapshot.paramMap.get("projectId")!)
    this.initDiagram()
    this.load()
    const token = localStorage.getItem('token')!;
    this.realtime.connectWithToken(token);

    // Log de depuración: ver a qué room te uniste
    this.realtime.onJoined((info) => console.log('[WS] joined', info.room));

    // Efecto: cuando hay conexión y ya tenemos ids => join (y re-join si cambia branch)
    runInInjectionContext(this.env, () => {
      effect(() => {
        if (!this.realtime.connected()) return;
        const pid = this.projectId();
        const bid = this.branchId();
        if (!pid) return;
        // Si no hay branch aún, también join al room del proyecto.
        this.realtime.join({ projectId: pid });
        if (bid) this.realtime.join({ projectId: pid, branchId: bid });
      });
      this.realtime.onJoined(info => console.log('[WS] joined', info.room));
      // Listener de parches entrantes
      this.remoteOff = this.realtime.onPatch(({ patch }) => {
        console.log('[WS] patch recibido', patch);
        if (patch) this.applyRemotePatch(patch);
      });
    })
  }
  ngOnDestroy() {
    this.remoteOff?.();
    if (this.diagram) {
      if (this.modelChangedListener) {
        ; (this.diagram.model as go.Model).removeChangedListener(this.modelChangedListener)
      }
      if (this.selectionChangedHandler) {
        this.diagram.removeDiagramListener("ChangedSelection", this.selectionChangedHandler)
      }
      if (this.linkDrawnHandler) {
        this.diagram.removeDiagramListener("LinkDrawn", this.linkDrawnHandler)
      }
      this.diagram.div = null
    }
  }


  private bindAutosaveAndRealtime(model: go.GraphLinksModel) {
    const doAutosave = debounce(() => this.save('auto-save'), 800);
    const doBroadcast = debounce(() => {
      const patch = this.serializeModel();
      this.realtime.sendPatch({ projectId: this.projectId(), branchId: this.branchId(), patch });
    }, 250);

    this.modelChangedListener = (e) => {
      if (e.isTransactionFinished) {
        if (!this.applyingRemote) {
          doBroadcast();
          this.status.set('Cambios pendientes…');
          doAutosave();
        }
      }
    };
    model.addChangedListener(this.modelChangedListener);
  }

  private serializeModel() {
    const m = this.glm();
    // MVP: reemplazo completo (nodos + enlaces)
    return {
      nodeDataArray: (m.nodeDataArray as any[]),
      linkDataArray: (m.linkDataArray as any[]),
    };
  }


  private glm(): go.GraphLinksModel {
    return this.diagram.model as go.GraphLinksModel;
  }

  private applyRemotePatch(patch: { nodeDataArray: any[]; linkDataArray: any[] }) {
    const m = this.glm();
    this.applyingRemote = true;  // no dispares autosave/broadcast
    m.startTransaction('remote');
    // Reemplazo completo; mantiene claves y bindings
    m.nodeDataArray = patch.nodeDataArray ?? [];
    m.linkDataArray = patch.linkDataArray ?? [];
    m.commitTransaction('remote');
    setTimeout(() => (this.applyingRemote = false), 50);
  }


  attrsFA(): FormArray {
    return this.nodeForm.get("attrs") as FormArray
  }
  private makeAttrArray(items: EntityAttr[]) {
    return items.map((a) =>
      this.fb.group({
        name: [a.name, Validators.required],
        type: [a.type || "string", Validators.required],
        pk: [!!a.pk],
        unique: [!!a.unique],
        nullable: [!!a.nullable],
      }),
    )
  }

  // ---------------- Diagram setup
  private initDiagram() {
    const $ = go.GraphObject.make
    const diag = $(go.Diagram, this.diagramRef.nativeElement, {
      "undoManager.isEnabled": true,
      "grid.visible": true,
      "grid.gridCellSize": new go.Size(10, 10),
      "draggingTool.isGridSnapEnabled": true,
      "resizingTool.isGridSnapEnabled": true,
      "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
      initialContentAlignment: go.Spot.Center,
      layout: $(go.LayeredDigraphLayout, { layerSpacing: 50, columnSpacing: 20 }),
    })


    // Regla: no lazos A→A y no duplicados
    diag.toolManager.linkingTool.archetypeLinkData = { kind: "association", fromCard: "N", toCard: "1" }
    diag.toolManager.linkingTool.linkValidation = (fromnode, _fp, tonode, _tp, _link) => {
      if (!fromnode || !tonode) return false
      if (fromnode === tonode) return false

      const fromKey = fromnode.data.key as string
      const toKey = tonode.data.key as string

      // 👇 casteo al modelo correcto
      const m = diag.model as go.GraphLinksModel
      const exists = m.linkDataArray.some((l: any) => l.from === fromKey && l.to === toKey)
      return !exists
    }

    // Atributos (item template)… igual que antes (omito por brevedad)
    const attrTemplate = $(
      go.Panel,
      "TableRow",
      new go.Binding("portId", "name"),
      $(
        go.Shape,
        "Rectangle",
        { column: 0, width: 8, height: 8, strokeWidth: 0, margin: 2 },
        new go.Binding("fill", "", (a: any) => (a.pk ? "#111827" : a.unique ? "#6b7280" : "#e5e7eb")),
      ),
      $(
        go.TextBlock,
        { column: 1, editable: true, margin: new go.Margin(2, 4, 2, 2) },
        new go.Binding("text", "name").makeTwoWay(),
      ),
      $(
        go.TextBlock,
        { column: 2, editable: true, margin: new go.Margin(2, 4, 2, 2), stroke: "#6b7280" },
        new go.Binding("text", "type").makeTwoWay(),
      ),
    )

    // Clase (nodeTemplate)
    diag.nodeTemplate = $(
      go.Node,
      "Auto",
      { locationSpot: go.Spot.Center, resizable: true },
      $(go.Shape, "RoundedRectangle", {
        fill: "#fff",
        stroke: "#d1d5db",
        strokeWidth: 1,
        parameter1: 8,
        portId: "",
        fromLinkable: true,
        toLinkable: true,
      }),
      $(
        go.Panel,
        "Table",
        { minSize: new go.Size(200, Number.NaN), defaultRowSeparatorStroke: "#e5e7eb" },
        $(
          go.Panel,
          "TableRow",
          { background: "#f9fafb" },
          $(
            go.TextBlock,
            { margin: 6, row: 0, column: 0, columnSpan: 3, font: "bold 12pt sans-serif", editable: true },
            new go.Binding("text", "name").makeTwoWay(),
          ),
        ),
        $(
          go.TextBlock,
          { row: 1, column: 0, columnSpan: 3, margin: new go.Margin(0, 6, 4, 6), stroke: "#6b7280", editable: true },
          new go.Binding("text", "stereotype").makeTwoWay(),
        ),
        $(
          go.Panel,
          "Table",
          { row: 2, column: 0, itemTemplate: attrTemplate },
          new go.Binding("itemArray", "attrs").makeTwoWay(),
        ),
      ),
    )

    // Relación (linkTemplate)
    diag.linkTemplate = $(
      go.Link,
      {
        routing: go.Link.AvoidsNodes,
        corner: 8,
        relinkableFrom: true,
        relinkableTo: true,
        reshapable: true,
        resegmentable: true,
      },
      $(
        go.Shape,
        { stroke: "#6b7280" },
        new go.Binding("strokeDashArray", "kind", (k: string) => (k === "aggregation" ? [6, 4] : null)),
      ),
      $(
        go.Shape,
        { toArrow: "Standard", stroke: null, fill: "#6b7280" },
        new go.Binding("toArrow", "kind", (k: string) => (k === "composition" ? "Diamond" : "Standard")),
        new go.Binding("fill", "kind", (k: string) => (k === "composition" ? "#111827" : "#6b7280")),
      ),
      $(
        go.Panel,
        "Auto",
        $(go.Shape, "RoundedRectangle", { fill: "#f3f4f6", stroke: null }),
        $(go.TextBlock, { margin: 2, editable: true }, new go.Binding("text", "fromCard").makeTwoWay()),
        { segmentIndex: 0, segmentOffset: new go.Point(-10, -10) },
      ),
      $(
        go.Panel,
        "Auto",
        $(go.Shape, "RoundedRectangle", { fill: "#f3f4f6", stroke: null }),
        $(go.TextBlock, { margin: 2, editable: true }, new go.Binding("text", "toCard").makeTwoWay()),
        { segmentIndex: -1, segmentOffset: new go.Point(10, 10) },
      ),
    )

    // Modelo + listeners
    const model = $(go.GraphLinksModel, { copiesArrays: true, copiesArrayObjects: true, linkKeyProperty: "key" })

    // autosave con debounce
    const doAutosave = debounce(() => this.save("auto-save"), 800)

    this.modelChangedListener = (e) => {
      if (e.isTransactionFinished) {
        this.status.set("Cambios pendientes…")
        doAutosave()
      }
    }
    model.addChangedListener(this.modelChangedListener)

    // Diagram listeners: guarda referencias para quitarlos después
    this.selectionChangedHandler = () => this.onSelectionChanged()
    this.linkDrawnHandler = (ev) => this.onLinkDrawn(ev.subject as go.Link)
    diag.addDiagramListener("ChangedSelection", this.selectionChangedHandler)
    diag.addDiagramListener("LinkDrawn", this.linkDrawnHandler)

    this.diagram = diag
    this.diagram.model = model

    this.bindAutosaveAndRealtime(model);
  }

  // ------------- Selection & forms
  private onSelectionChanged() {
    const sel = this.diagram.selection.first()
    if (!sel) {
      this.selectedType.set(null)
      this.selectedNodeData = undefined
      this.selectedLinkData = undefined
      return
    }
    if (sel instanceof go.Node) {
      this.selectedType.set("node")
      this.selectedNodeData = sel.data
      const attrs: EntityAttr[] = (sel.data.attrs ?? []).map((a: any) => ({
        name: a.name,
        type: a.type,
        pk: !!a.pk,
        unique: !!a.unique,
        nullable: !!a.nullable,
      }))
      this.nodeForm.reset({ name: sel.data.name ?? "", stereotype: sel.data.stereotype ?? "" })
      const arr = this.makeAttrArray(attrs)
      this.nodeForm.setControl("attrs", this.fb.array(arr))
    } else if (sel instanceof go.Link) {
      this.selectedType.set("link")
      this.selectedLinkData = sel.data
      this.linkForm.reset({
        kind: sel.data.kind ?? "association",
        fromCard: sel.data.fromCard ?? "N",
        toCard: sel.data.toCard ?? "1",
      })
    }
  }

  addAttr() {
    this.attrsFA().push(
      this.fb.group({
        name: ["field", Validators.required],
        type: ["string", Validators.required],
        pk: [false],
        unique: [false],
        nullable: [true],
      }),
    )
  }
  removeAttr(i: number) {
    this.attrsFA().removeAt(i)
  }

  applyNodeForm() {
    if (!this.selectedNodeData || this.nodeForm.invalid) return
    const m = this.diagram.model as go.GraphLinksModel
    const { name, stereotype } = this.nodeForm.value
    const attrs = this.attrsFA().getRawValue()
    this.diagram.startTransaction("apply-node")
    m.setDataProperty(this.selectedNodeData, "name", name)
    m.setDataProperty(this.selectedNodeData, "stereotype", stereotype ?? "")
    m.setDataProperty(this.selectedNodeData, "attrs", attrs)
    this.diagram.commitTransaction("apply-node")
  }

  applyLinkForm() {
    if (!this.selectedLinkData) return
    const m = this.diagram.model as go.GraphLinksModel
    const { kind, fromCard, toCard } = this.linkForm.value
    this.diagram.startTransaction("apply-link")
    m.setDataProperty(this.selectedLinkData, "kind", kind)
    m.setDataProperty(this.selectedLinkData, "fromCard", fromCard)
    m.setDataProperty(this.selectedLinkData, "toCard", toCard)
    this.diagram.commitTransaction("apply-link")
    // sugerir FK si aplica
    this.maybeSuggestFK(this.selectedLinkData)
  }

  // ------------- Actions
  addClass() {
    const m = this.diagram.model as go.GraphLinksModel
    const p = this.diagram.viewportBounds.center
    this.diagram.startTransaction("new-class")
    const key = crypto.randomUUID()
    m.addNodeData({
      key,
      name: "Clase",
      stereotype: "entity",
      attrs: [{ name: "id", type: "uuid", pk: true, nullable: false }],
    })
    const n = this.diagram.findNodeForKey(key)
    if (n) n.location = p
    this.diagram.commitTransaction("new-class")
  }
  layout() {
    ; (this.diagram.layout as any)?.doLayout(this.diagram)
  }
  undo() {
    ; (this.diagram.undoManager as any).undo()
  }
  redo() {
    ; (this.diagram.undoManager as any).redo()
  }
  canUndo() {
    return (this.diagram.undoManager as any)?.canUndo()
  }
  canRedo() {
    return (this.diagram.undoManager as any)?.canRedo()
  }

  // ------------- Load/Save
  private toDSL(): DSL {
    const m = this.diagram.model as go.GraphLinksModel
    const entities: Entity[] = (m.nodeDataArray as any[]).map((n) => ({
      name: n.name,
      stereotype: n.stereotype ?? "",
      attrs: (n.attrs ?? []) as EntityAttr[],
    }))
    const relations: Relation[] = (m.linkDataArray as any[]).map((l, i) => {
      const from = (m as any).findNodeDataForKey(l.from)?.name
      const to = (m as any).findNodeDataForKey(l.to)?.name
      return { from, to, kind: l.kind ?? "association", fromCard: l.fromCard ?? "N", toCard: l.toCard ?? "1" }
    })
    return { entities, relations, constraints: [] }
  }

  private fromDSL(dsl: DSL) {
    const nodeData = dsl.entities.map((e) => ({
      key: e.name,
      name: e.name,
      stereotype: e.stereotype ?? "",
      attrs: e.attrs ?? [],
    }))
    const linkData = dsl.relations.map((r, i) => ({
      key: `L${i}`,
      from: r.from,
      to: r.to,
      kind: r.kind ?? "association",
      fromCard: r.fromCard ?? "N",
      toCard: r.toCard ?? "1",
    }))
    const m = this.diagram.model as go.GraphLinksModel
    m.startTransaction("load")
    m.nodeDataArray = nodeData
    m.linkDataArray = linkData
    m.commitTransaction("load")
  }

  private load() {
    this.api.getCurrent(this.projectId(), this.branchId()).subscribe({
      next: (res) => {
        this.branchId.set(res.branchId)
        this.fromDSL(res.content as DSL)
        this.status.set(`Cargado v:${res.versionId.slice(0, 6)} (${res.branchId})`)
      },
      error: (e) => this.status.set(e?.error?.message ?? "Error al cargar"),
    })
  }

  save(message = "edit") {
    const dsl = this.toDSL()
    this.api.save(this.projectId(), { branchId: this.branchId(), message, content: dsl }).subscribe({
      next: (r) => this.status.set(`Guardado ${new Date(r.createdAt).toLocaleTimeString()}`),
      error: (e) => this.status.set(e?.error?.message ?? "Error al guardar"),
    })
  }

  // ------------- Regla: sugerir FK en N→1
  private onLinkDrawn(link: go.Link) {
    const data = link.data
    // defaults al crear
    if (!data.fromCard) data.fromCard = "N"
    if (!data.toCard) data.toCard = "1"
    this.maybeSuggestFK(data)
  }

  private maybeSuggestFK(linkData: any) {
    const m = this.diagram.model as go.GraphLinksModel
    const fromNode = (m as any).findNodeDataForKey(linkData.from)
    const toNode = (m as any).findNodeDataForKey(linkData.to)
    if (!fromNode || !toNode) return

    const fromCard = (linkData.fromCard ?? "N").toUpperCase()
    const toCard = (linkData.toCard ?? "1").toUpperCase()
    // Heurística: N→1 (o N..1) ⇒ FK en origen
    const isNto1 = (c: string) => c.includes("N")
    const is1 = (c: string) => c === "1" || c === "0..1"
    if (isNto1(fromCard) && is1(toCard)) {
      // nombre: <toName>Id
      const toName = (toNode.name as string) || "Ref"
      const fk = toName.charAt(0).toLowerCase() + toName.slice(1) + "Id"
      const attrs: EntityAttr[] = fromNode.attrs ?? []
      if (!attrs.some((a) => a.name === fk)) {
        this.diagram.startTransaction("add-fk")
        attrs.push({ name: fk, type: "uuid", nullable: false })
        m.setDataProperty(fromNode, "attrs", attrs)
        this.diagram.commitTransaction("add-fk")
        this.status.set(`Sugerencia aplicada: FK "${fk}" en ${fromNode.name}`)
      }
    }
  }
}
