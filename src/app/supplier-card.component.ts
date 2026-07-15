import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierResult } from './models';

/**
 * Tek bir tedarikçinin sonuç bloğunu gösterir:
 * başlık (tedarikçi adı + "sitede ara" linki), ürün satırları ve durum notları.
 */
@Component({
  selector: 'app-supplier-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="supplier">
      <header class="supplier__head">
        <h2>{{ supplier.supplier }}</h2>
        <a class="supplier__open" [href]="supplier.searchUrl" target="_blank" rel="noopener">
          Sitede aç ↗
        </a>
      </header>

      <!-- Ürünler -->
      <ul class="products" *ngIf="supplier.products.length; else empty">
        <li class="product" *ngFor="let p of supplier.products">
          <a class="product__link" [href]="p.url" target="_blank" rel="noopener">
            <span class="product__name">{{ p.name }}</span>
            <span class="product__meta">
              <span class="tag" *ngIf="p.catalogNumber">{{ p.catalogNumber }}</span>
              <span class="tag" *ngIf="p.packSize">{{ p.packSize }}</span>
              <span class="tag tag--muted" *ngIf="p.purity">{{ p.purity }}</span>
              <span class="price" *ngIf="p.price">{{ p.price }}</span>
            </span>
          </a>
        </li>
      </ul>

      <!-- Boş / hata durumları -->
      <ng-template #empty>
        <p class="status" [class.status--error]="!supplier.success">
          {{ supplier.success
              ? (supplier.note || 'Bu CAS için ürün bulunamadı.')
              : 'Bu tedarikçiye şu an ulaşılamadı.' }}
        </p>
        <a class="cta" [href]="supplier.searchUrl" target="_blank" rel="noopener">
          {{ supplier.supplier }} sitesinde bu CAS'i aç →
        </a>
      </ng-template>

      <p class="count" *ngIf="supplier.products.length">
        {{ supplier.products.length }} sonuç
      </p>
    </section>
  `,
  styles: [`
    .supplier { background:#fff; border:1px solid #e6e8eb; border-radius:14px; padding:18px 20px; }
    .supplier__head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
    .supplier__head h2 { font-size:1.05rem; margin:0; color:#0f172a; }
    .supplier__open { font-size:.8rem; color:#2563eb; text-decoration:none; white-space:nowrap; }
    .supplier__open:hover { text-decoration:underline; }
    .products { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
    .product__link { display:flex; flex-direction:column; gap:6px; padding:10px 12px; border:1px solid #eef1f4;
      border-radius:10px; text-decoration:none; color:inherit; transition:border-color .15s, background .15s; }
    .product__link:hover { border-color:#2563eb; background:#f8faff; }
    .product__name { font-weight:600; color:#0f172a; font-size:.92rem; line-height:1.3; }
    .product__meta { display:flex; flex-wrap:wrap; align-items:center; gap:6px; }
    .tag { font-size:.72rem; background:#eef2f7; color:#475569; padding:2px 8px; border-radius:999px; }
    .tag--muted { background:transparent; color:#94a3b8; padding-left:0; }
    .price { font-size:.8rem; font-weight:700; color:#047857; margin-left:auto; }
    .status { font-size:.85rem; color:#64748b; margin:4px 0 0; }
    .status--error { color:#b45309; }
    .cta { display:inline-block; margin-top:10px; padding:8px 14px; font-size:.82rem; font-weight:600;
      color:#2563eb; background:#f0f5ff; border:1px solid #dbe4ff; border-radius:9px; text-decoration:none; }
    .cta:hover { background:#e2ecff; }
    .count { font-size:.72rem; color:#94a3b8; margin:10px 0 0; text-align:right; }
  `],
})
export class SupplierCardComponent {
  @Input({ required: true }) supplier!: SupplierResult;
}
