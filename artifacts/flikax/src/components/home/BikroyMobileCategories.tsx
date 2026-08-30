"use client";
import Link from 'next/link';
import { useState } from 'react';

type Cat = { name: string; slug: string; emoji: string; count: number };

const CATS: Cat[] = [
  { name: 'Vehicles', slug: 'vehicles', emoji: '🚗', count: 25 },
  { name: 'Property', slug: 'property', emoji: '🏠', count: 18 },
  { name: 'Phones & Tablets', slug: 'phones-tablets', emoji: '📱', count: 10 },
  { name: 'Electronics', slug: 'electronics', emoji: '💻', count: 24 },
  { name: 'Home, Furniture', slug: 'home-furniture', emoji: '🛋️', count: 22 },
  { name: 'Fashion', slug: 'fashion', emoji: '👗', count: 35 },
  { name: 'Beauty & Personal Care', slug: 'beauty', emoji: '💄', count: 15 },
  { name: 'Services', slug: 'services', emoji: '🔧', count: 14 },
  { name: 'Repair & Construction', slug: 'repair-construction', emoji: '🏗️', count: 8 },
  { name: 'Commercial', slug: 'commercial', emoji: '⚙️', count: 9 },
  { name: 'Animals & Pets', slug: 'animals-pets', emoji: '🐶', count: 17 },
  { name: 'Babies & Kids', slug: 'babies-kids', emoji: '🧸', count: 20 },
  { name: 'Jobs', slug: 'jobs', emoji: '💼', count: 41 },
  { name: 'Agriculture', slug: 'agriculture', emoji: '🌾', count: 11 },
];

export default function BikroyMobileCategories() {
  const [open, setOpen] = useState(false);
  const visible = open ? CATS : CATS.slice(0, 7);
  const total = CATS.reduce((a,b)=>a+b.count,0);
  const box: React.CSSProperties = { width:68, height:68, background:'#f1f5f9', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 6px' };

  return (
    <div className="block md:hidden bg-white" style={{ padding:'10px 8px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px 4px' }}>
        <Link href="/sell" style={{ textDecoration:'none', textAlign:'center' }}>
          <div style={{ ...box, background:'#ffbc65' }}>
            <div style={{ width:42, height:42, background:'white', borderRadius:999, display:'flex', alignItems:'center', justifyContent:'center', color:'#ffbc65', fontSize:28, fontWeight:700 }}>+</div>
          </div>
          <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#111' }}>Post ad</p>
        </Link>
        {!open && (
          <div style={{ textAlign:'center' }}>
            <div style={box}><span style={{ fontSize:32 }}>🔥</span></div>
            <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#111' }}>Trending</p>
          </div>
        )}
        {visible.map(c=>(
          <Link key={c.slug} href={`/${c.slug}`} style={{ textDecoration:'none', textAlign:'center' }}>
            <div style={box}><span style={{ fontSize:36 }}>{c.emoji}</span></div>
            <p style={{ margin:'0 auto', fontSize:11, fontWeight:600, color:'#222', lineHeight:'12px', maxWidth:72 }}>{c.name}</p>
          </Link>
        ))}
        <button onClick={()=>setOpen(!open)} style={{ border:0, background:'none', textAlign:'center', cursor:'pointer' }}>
          <div style={box}>{open ? '▲' : '☰'}</div>
          <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#111' }}>{open ? 'Less' : 'All categories'}</p>
          <span style={{ fontSize:10, color:'#888' }}>{total} ads</span>
        </button>
      </div>
    </div>
  );
}