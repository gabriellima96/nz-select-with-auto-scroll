import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import { map } from 'rxjs/operators';

export interface Colaborador {
  matricula: number;
  tipoColaborador: number;
  empresa: number;
  nomeCompleto: string;
}

export interface SearchProcess {
  code: number;
  text: string;
}

interface ResponseColaboradores {
  colaboradores: Colaborador[];
}

interface SearchColaborador {
  empresaSolicitante: number;
  tipoSolicitante: number;
  matriculaSolicitante: number;
  top: number;
  skip: number;
  matriculaPesquisa?: number;
  nomeCompletoPesquisa?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ColaboradorService {
  private URL = environment.getColaboradoresURL;

  constructor(private http: HttpClient) {}

  getColaboradores(search: SearchColaborador): Observable<Colaborador[]> {
    const nomeCompleto = encodeURIComponent(search.nomeCompletoPesquisa || '');
    return this.http
      .get<ResponseColaboradores>(
        `${this.URL}&empresaSolicitante=${
          search.empresaSolicitante
        }&matriculaSolicitante=${search.matriculaSolicitante}&tipoSolicitante=${
          search.tipoSolicitante
        }&top=${search.top}&skip=${
          search.skip
        }&nomeCompleto=${nomeCompleto}&matricula=${
          search.matriculaPesquisa || 0
        }`,
        {
          headers: {
            authorization: 'bearer jpc2Mq5RRMwLlo7BsyUwDuMOOar3tuJs',
            user: 'marlon',
          },
        }
      )
      .pipe(map((response) => response.colaboradores));
  }

  createSearchProcess(text: string): SearchProcess {
    const searchProcess: SearchProcess = { code: 0, text: '' };

    if (text) {
      let textTrim = text.trim();

      /** Verifica se existe código(número) no inicio do texto
       *  Caso exista e separado do texto */
      if (textTrim.match(/^\d.*$/)) {
        const codeString = textTrim.replace(/[^\d].*$/g, '');
        /** Removendo o código(número) do texto */
        textTrim = textTrim.substring(codeString.length).trim();
        searchProcess.code = +codeString;
      }

      /** Removendo espaços e '-' do texto */
      textTrim = textTrim.replace(/^-/, '').trim();
      searchProcess.text = textTrim;
    }

    return searchProcess;
  }
}
