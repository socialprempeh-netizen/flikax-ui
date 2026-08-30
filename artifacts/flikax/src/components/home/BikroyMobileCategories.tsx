type Cat = {
  name: string;
  emoji?: string;
  href?: string;
  yellow?: boolean;
};

const cats: Cat[] = [
  { name: 'Post ad', yellow: true },
  { name: 'Trending', emoji: '🔥' },
  { name: 'Vehicles', emoji: '🚗', href: '/c/vehicles' },
  { name: 'Property', emoji: '🏠', href: '/c/property' },
  { name: 'Phones & Tablets', emoji: '📱', href: '/c/phones' },
  { name: 'Electronics', emoji: '💻', href: '/c/electronics' },
  { name: 'Home, Furniture', emoji: '🛋️', href: '/c/home' },
  { name: 'Fashion', emoji: '👗', href: '/c/fashion' },
  { name: 'Beauty', emoji: '💄', href: '/c/beauty' },
  { name: 'Services', emoji: '🔧', href: '/c/services' },
  { name: 'Repair', emoji: '🏗️', href: '/c/repair' },
  { name: 'Commercial', emoji: '⚙️', href: '/c/commercial' },
];

export default function BikroyMobileCategories() {
  return (
    <div style={{ background: 'white', padding: '0 6px' }} className="block md:hidden">
      <ul style={{ display: 'flex', flexWrap: 'wrap', listStyle: 'none', padding: 0, margin: 0 }}>
        {cats.map((c) => (
          <li key={c.name} style={{ flex: '0 0 25%', display: 'flex', justifyContent: 'center', padding: '8px 2px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, background: c.yellow ? '#ffbc65' : '#ebf2f7', borderRadius: 8, marginBottom: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.yellow ? (
                  <div style={{ width: 40, height: 40, background: 'white', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffbc65', fontSize: 24, fontWeight: 'bold' }}>+</div>
                ) : (
                  <span style={{ fontSize: 28 }}>{c.emoji}</span>
                )}
              </div>
              <p style={{ color: '#28363e', fontSize: 11, lineHeight: '13px', fontWeight: 500, margin: 0, textAlign: 'center' }}>{c.name}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}