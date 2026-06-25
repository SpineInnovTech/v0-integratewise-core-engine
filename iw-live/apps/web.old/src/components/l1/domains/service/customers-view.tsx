import { useState } from "react";
import { Users, Search, Loader2, MoreHorizontal, Building2 } from "lucide-react";
import { useHydrateDomainTable } from "@/components/core/hydration/use-hydrate-projection";

export function CustomersView() {
  const { data, loading } = useHydrateDomainTable<any>("service", "customers");
  const [search, setSearch] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const customers = data?.items || [];
  const filtered = customers.filter(
    (c: any) => !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Customers
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customer accounts and contact information.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No customers found
          </div>
        ) : (
          filtered.map((customer: any) => (
            <div
              key={customer.id}
              className="rounded-lg border p-4 hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{customer.name || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.email || customer.industry || "—"}
                    </div>
                  </div>
                </div>
                <button className="p-1 hover:bg-muted rounded">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{customer.ticketCount || 0} tickets</span>
                <span>Last active: {customer.lastActivity || "—"}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CustomersView;
