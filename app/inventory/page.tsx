import { prisma } from '@/lib/prisma';

export default async function InventoryPage() {
  // 1. ดึงข้อมูลจากตาราง products
  const allProducts = await prisma.products.findMany({
    orderBy: { created_at: 'desc' },
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🌿 Smile Seed Bank Inventory</h1>
            <p className="text-gray-500">จัดการสต็อกเมล็ดพันธุ์ Fastbuds และแบรนด์อื่นๆ</p>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            + เพิ่มสินค้าใหม่
          </button>
        </header>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-sm text-gray-700">SKU</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-700">ชื่อสายพันธุ์</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-700">หมวดหมู่</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-700 text-center">THC %</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-700 text-center">สต็อก</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-700">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allProducts.map((product) => (
                <tr key={product.id.toString()} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-mono text-blue-600">{product.master_sku}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.seed_type} | {product.flowering_type}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded-md">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-bold text-orange-600">
                    {product.thc_percent?.toString()}%
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className={`font-bold ${Number(product.stock) < 10 ? 'text-red-500' : 'text-green-600'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.is_active ? (
                      <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full border border-green-200">เปิดขาย</span>
                    ) : (
                      <span className="text-red-600 text-xs bg-red-50 px-2 py-1 rounded-full border border-red-200">ปิดการขาย</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}