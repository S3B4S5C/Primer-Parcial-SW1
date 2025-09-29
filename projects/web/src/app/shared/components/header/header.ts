import { Component, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterLink, RouterLinkActive, Router } from "@angular/router"
import { AuthService } from "../../../core/services/auth"

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: "./header.html",
  styleUrl: "./header.scss",
})
export class HeaderComponent {
  private auth = inject(AuthService)
  private router = inject(Router)

  logout() {
    this.auth.logout()
    this.router.navigateByUrl("/login")
  }
}
