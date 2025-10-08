import { Component, OnInit } from '@angular/core';
import { TextComponent } from "../text-component/text-component.component";
import { TreeFileComponent } from '../tree-file/tree-file.component';
import { FilesManagerService } from '../../services/files-manager.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [TreeFileComponent, TextComponent],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent implements OnInit {

  constructor(private fms : FilesManagerService, private router: Router ) {}

  ngOnInit(): void {
    if (!localStorage.getItem('token')) {
      this.router.navigateByUrl('/login');
    }
  }
}
