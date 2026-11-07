import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";
import { adminService } from "@/services";
import { formatPrice } from "@/utils/format";
import { formatDateTime } from "@/components/admin/orderStatus";
import {
  Field,
  PageHeader,
  Panel,
  QueryState,
  TableScroll,
  Td,
  Th,
  inputClass,
  primaryButtonClass,
  rowClass,
} from "@/components/admin/AdminUi";
import { StatusBadge } from "@/components/admin/orderStatus";

const StatCard = ({ label, value }) => (
  <div className="bg-card border border-border rounded-2xl p-5">
    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
    <p className="text-3xl font-display text-gradient">{value}</p>
  </div>
);

const ExportButton = ({ href, label }) => (
  <a href={href} className={primaryButtonClass} target="_blank" rel="noreferrer">
    <Download className="w-4 h-4" /> {label}
  </a>
);

const AdminReportsPage = () => {
  const [range, setRange] = useState({ from: "", to: "" });
  const params = {
    ...(range.from ? { from: range.from } : {}),
    ...(range.to ? { to: new Date(`${range.to}T23:59:59`).toISOString() } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "reports", range.from, range.to],
    queryFn: () => adminService.reports(params),
  });
  const subscribers = useQuery({
    queryKey: ["admin", "subscribers"],
    queryFn: () => adminService.subscribers({ page: 1, limit: 50 }),
  });

  const report = query.data;

  return (
    <>
      <PageHeader title="" accent="REPORTS" subtitle="Sales insights and data exports" />

      <Panel title="DATE RANGE" className="mb-6">
        <div className="p-5 flex flex-wrap items-end gap-4">
          <Field label="From">
            <input
              type="date"
              value={range.from}
              onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={range.to}
              onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <button
            type="button"
            onClick={() => setRange({ from: "", to: "" })}
            className="px-5 py-2.5 rounded-full border border-border text-xs font-semibold uppercase tracking-widest hover:border-primary"
          >
            Reset
          </button>
          <div className="flex flex-wrap gap-2 ml-auto">
            <ExportButton href={adminService.exportUrl("orders", params)} label="Orders CSV" />
            <ExportButton href={adminService.exportUrl("customers")} label="Customers CSV" />
            <ExportButton href={adminService.exportUrl("products")} label="Products CSV" />
          </div>
        </div>
      </Panel>

      <QueryState query={query}>
        {report && (
          <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <StatCard label="Orders" value={report.totalOrders} />
              <StatCard label="Delivered revenue" value={formatPrice(report.revenue.total)} />
              <StatCard label="GST collected" value={formatPrice(report.revenue.tax)} />
              <StatCard
                label="Discounts"
                value={formatPrice(report.revenue.discount + report.revenue.couponDiscount)}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <Panel title="ORDERS BY STATUS">
                <ul className="p-5 space-y-3">
                  {report.byStatus.length === 0 && (
                    <li className="text-sm text-muted-foreground">No orders in this range.</li>
                  )}
                  {report.byStatus.map((row) => (
                    <li key={row.status} className="flex items-center justify-between gap-3">
                      <StatusBadge status={row.status} />
                      <span className="font-medium">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="TOP PRODUCTS">
                <ul className="p-5 space-y-3">
                  {report.topProducts.length === 0 && (
                    <li className="text-sm text-muted-foreground">No product sales yet.</li>
                  )}
                  {report.topProducts.map((product) => (
                    <li key={product._id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{product.name}</span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {product.units} units · {formatPrice(product.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            <Panel title="DAILY SALES" className="mb-6">
              <TableScroll>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th className="text-right">Orders</Th>
                    <Th className="text-right">Revenue</Th>
                  </tr>
                </thead>
                <tbody>
                  {[...report.daily].reverse().slice(0, 30).map((row) => (
                    <tr key={row.date} className={rowClass}>
                      <Td>{row.date}</Td>
                      <Td className="text-right">{row.orders}</Td>
                      <Td className="text-right">{formatPrice(row.revenue)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableScroll>
            </Panel>
          </>
        )}
      </QueryState>

      <Panel
        title="NEWSLETTER SUBSCRIBERS"
        action={
          <a href={adminService.subscribersExportUrl()} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </a>
        }
      >
        <QueryState query={subscribers} isEmpty={!subscribers.data?.items?.length} emptyMessage="No subscribers yet.">
          <TableScroll>
            <thead>
              <tr>
                <Th>Email</Th>
                <Th>Subscribed</Th>
              </tr>
            </thead>
            <tbody>
              {(subscribers.data?.items ?? []).map((row) => (
                <tr key={row._id} className={rowClass}>
                  <Td>{row.email}</Td>
                  <Td>{formatDateTime(row.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
        </QueryState>
      </Panel>
    </>
  );
};

export default AdminReportsPage;
