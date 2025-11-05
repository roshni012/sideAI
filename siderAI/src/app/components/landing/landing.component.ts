import { Component } from '@angular/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  showLoginDialog = false;

  openLoginDialog() {
    this.showLoginDialog = true;
    document.body.style.overflow = 'hidden';
  }

  closeLoginDialog() {
    this.showLoginDialog = false;
    document.body.style.overflow = '';
  }

  loginWithGoogle() {
    console.log('Login with Google');
    // TODO: Implement Google login
  }

  loginWithApple() {
    console.log('Login with Apple');
    // TODO: Implement Apple login
  }

  loginWithPhone() {
    console.log('Login with Phone');
    // TODO: Implement Phone login
  }
}

