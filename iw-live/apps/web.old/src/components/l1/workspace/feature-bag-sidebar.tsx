import { useWorkspaceBagSafe } from "@/contexts/workspace-bag-context";
import { X } from "lucide-react";

export function FeatureBagSidebar() {
  const { items, isOpen, setIsOpen, removeItem } = useWorkspaceBagSafe();

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l z-50 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Workspace Bag</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close workspace bag"
        >
          <X size={20} />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">No items in bag</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 transition"
            >
              <div className="flex-1">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-gray-500">{item.type}</div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-iw-red/70 hover:text-red-600 text-xs ml-2"
                aria-label={`Remove ${item.label}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FeatureBagSidebar;
