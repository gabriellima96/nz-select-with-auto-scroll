import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  switchMap,
  take,
} from 'rxjs/operators';
import { Colaborador, ColaboradorService } from './colaborador.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  colaboradores: Colaborador[] = [];

  /** Paginação e pesquisa */
  isLoadingColaboradores = false;
  isEndColaboradores = false;
  top = 10;
  skip = 0;
  search = '';
  searchChange$ = new BehaviorSubject('');

  /** Formulário */
  form: FormGroup = this.fb.group({
    colaborador: [null, Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private colaboradorService: ColaboradorService
  ) {}

  ngOnInit(): void {
    this.searchChange$
      .asObservable()
      .pipe(
        debounceTime(500),
        filter((query) => query.length >= 2 || query.length === 0),
        distinctUntilChanged(),
        switchMap((query) =>
          query
            ? from(this.searchLoadColaboradores(query))
            : from(of(this.colaboradores))
        )
      )
      .subscribe((colaboradores: Colaborador[]) => {
        this.colaboradores = colaboradores;
        this.isLoadingColaboradores = false;
      });
  }

  onSearch(search: string) {
    this.searchChange$.next(search);
  }

  onScrollToBottom() {
    this.isLoadingColaboradores = true;
    this.loadColaboradores()
      .pipe(take(1))
      .subscribe((colaboradores) => {
        if (colaboradores && colaboradores.length < this.top) {
          this.isEndColaboradores = true;
        }

        this.colaboradores = this.colaboradores.concat(colaboradores);
        this.isLoadingColaboradores = false;
      });
  }

  searchLoadColaboradores(search: string): Observable<Colaborador[]> {
    this.isLoadingColaboradores = true;
    this.cleanSelect();
    this.search = search;
    return this.loadColaboradores();
  }

  loadColaboradores(): Observable<Colaborador[]> {
    const { code, text } = this.colaboradorService.createSearchProcess(
      this.search
    );

    if (!this.isEndColaboradores) {
      return this.colaboradorService
        .getColaboradores({
          empresaSolicitante: 1,
          tipoSolicitante: 1,
          matriculaSolicitante: 9,
          top: this.top,
          skip: this.skip,
          matriculaPesquisa: code,
          nomeCompletoPesquisa: text,
        })
        .pipe(
          catchError((error) => {
            console.error(error);

            this.notification.error(
              'Atenção',
              'Não foi possível carregar os colaboradores. Por favor, tente novamente mais tarde ou entre em contato com um administrador.'
            );

            return of([]);
          }),
          finalize(() => {
            this.skip += this.top;
          })
        );
    }

    return of([]);
  }

  compareColaborador(c1: Colaborador, c2: Colaborador): boolean {
    return c1 && c2
      ? c1.matricula === c2.matricula &&
          c1.tipoColaborador === c2.tipoColaborador &&
          c1.empresa === c2.empresa
      : c1 === c2;
  }

  cleanSelect() {
    this.colaboradores = [];
    this.top = 10;
    this.skip = 0;
    this.isEndColaboradores = false;
  }
}
