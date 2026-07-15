import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchResponse } from './models';

/**
 * Backend'e (/api/search) istek atan servis.
 * Vercel'de önyüz ile serverless fonksiyonlar aynı origin'dedir; bu yüzden
 * apiBase boştur ve istek '/api/search' olarak gider (CORS gerekmez).
 * Yerelde `vercel dev` çalıştırıldığında da aynı şekilde çalışır.
 */
@Injectable({ providedIn: 'root' })
export class CasSearchService {
  private http = inject(HttpClient);
  private readonly apiBase = ''; // aynı origin

  search(cas: string): Observable<SearchResponse> {
    const params = new HttpParams().set('cas', cas.trim());
    return this.http.get<SearchResponse>(`${this.apiBase}/api/search`, { params });
  }
}
