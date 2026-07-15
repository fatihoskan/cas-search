import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CasSearchService } from './cas-search.service';
import { SupplierCardComponent } from './supplier-card.component';
import { SearchResponse } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, SupplierCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private api = inject(CasSearchService);

  cas = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<SearchResponse | null>(null);

  // Geçerli CAS biçimi: 2-7 hane - 2 hane - 1 hane (örn. 67-68-5)
  private casPattern = /^\d{1,7}-\d{2}-\d$/;

  search(): void {
    const value = this.cas().trim();
    this.error.set(null);

    if (!value) { this.error.set('Lütfen bir CAS numarası girin.'); return; }
    if (!this.casPattern.test(value)) {
      this.error.set('Geçersiz CAS numarası. Örnek biçim: 67-68-5');
      return;
    }

    this.loading.set(true);
    this.result.set(null);
    this.api.search(value).subscribe({
      next: (res) => { this.result.set(res); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.error.set('Sunucuya ulaşılamadı. Lütfen biraz sonra tekrar deneyin.');
      },
    });
  }
}
