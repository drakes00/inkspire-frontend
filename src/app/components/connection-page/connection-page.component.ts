import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule, Router } from '@angular/router';
import { ConnectionService } from '../../services/connection.service';

@Component({
  selector: 'app-connection-page',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, RouterModule],
  templateUrl: './connection-page.component.html',
  styleUrl: './connection-page.component.css'
})
export class ConnectionPageComponent {

  connectionService = new ConnectionService()
  username : string = ""
  password : string = ""
  errorMessage = ""
  hid = true

  constructor(private router : Router){}

  connectionForm : FormGroup = new FormGroup({
    user : new FormControl(this.username, Validators.required),
    password : new FormControl(this.password, Validators.required)
  });


  // Subscribes to form control value changes to update component properties.
  ngOnInit() : void
  {
    this.connectionForm.get('user')?.valueChanges.subscribe(value=>{this.username=value})
    this.connectionForm.get('password')?.valueChanges.subscribe(value=>{this.password=value})
  }

  async loginUser()
  {
    const success = await this.connectionService.connectUser(this.username, this.password);

    if (success) {
      this.errorMessage = '';
      this.hid = true;
      this.router.navigateByUrl('/main');
    } else {
      this.errorMessage = 'Invalid username or password.';
      this.hid = false;
    }
  }

}
