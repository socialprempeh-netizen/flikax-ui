
"use client";
import Link from 'next/link';
import { useState } from 'react';

type Cat = { name: string; slug: string; emoji: string; count: number; img: string };

const CATS: Cat[] = [
  { name: 'Vehicles', slug: 'vehicles', emoji: '🚗', count: 25, img: '/icons/categories/vehicles.png' },
  { name: 'Phones & Tablets', slug: 'phones-tablets', emoji: '📱', count: 10, img: '/icons/categories/phones.png' },
  { name: 'Property', slug: 'property', emoji: '🏠', count: 18, img: '/icons/categories/property.png' },
  { name: 'Electronics', slug: 'electronics', emoji: '💻', count: 24, img: '/icons/categories/electronics.png' },
  { name: 'Fashion', slug: 'fashion', emoji: '👗', count: 35, img: '/icons/categories/fashion.png' },
  { name: 'Animals & Pets', slug: 'animals-pets', emoji: '🐶', count: 17, img: '/icons/categories/animals.png' },
  { name: 'Babies & Kids', slug: 'babies-kids', emoji: '🧸', count: 20, img: '/icons/categories/babies.png' },
  { name: 'Services', slug: 'services', emoji: '🔧', count: 14, img: '/icons/categories/services.png' },
  { name: 'Home, Furniture', slug: 'home-furniture', emoji: '🛋️', count: 22, img: '/icons/categories/home.png' },
  { name: 'Beauty', slug: 'beauty', emoji: '💄', count: 15, img: '/icons/categories/beauty.png' },
  { name: 'Repair', slug: 'repair-construction', emoji: '🏗️', count: 8, img: '/icons/categories/repair.png' },
  { name: 'Commercial', slug: 'commercial', emoji: '⚙️', count: 9, img: '/icons/categories/commercial.png' },
  { name: 'Jobs', slug: 'jobs', emoji: '💼', count: 41, img: '/icons/categories/jobs.png' },
  { name: 'Agriculture', slug: 'agriculture', emoji: '🌾', count: 11, img: '/icons/categories/agriculture.png' },
];

export default function BikroyMobileCategories() {
  const [open, setOpen] = useState(false);
  const visible = open ? CATS : CATS.slice(0, 7);
  const totalAds = CATS.reduce((a,b)=>a+b.count,0);

  return (
    <div className="block md:hidden bg-white" style={{ padding: '8px 6px' }}>
      <ul style={{ display:'flex', flexWrap:'wrap', listStyle:'none', padding:0, margin:0 }}>
        {/* Post ad - clickable */}
        <li style={{ flex:'0 0 25%', padding:'8px 2px', display:'flex', justifyContent:'center' }}>
          <Link href="/sell" style={{ textDecoration:'none', textAlign:'center' }}>
            <div style={{ width:60, height:60, background:'#ffbc65', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 5px' }}>
              <div style={{ width:36, height:36, background:'white', borderRadius:999, display:'flex', alignItems:'center', justifyContent:'center', color:'#ffbc65', fontWeight:'bold', fontSize:22 }}>+</div>
            </div>
            <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#111' }}>Post ad</p>
          </Link>
        </li>

        {visible.map(c=>(
          <li key={c.slug} style={{ flex:'0 0 25%', padding:'8px 2px', display:'flex', justifyContent:'center' }}>
            <Link href={`/${c.slug}`} style={{ textDecoration:'none', textAlign:'center' }}>
              <div style={{ width:60, height:60, background:'#ebf2f7', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 5px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt={c.name} width={32} height={32} style={{ objectFit:'contain' }} onError={(e)=>{ (e.target as HTMLImageElement).style.display='none'; ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display='block'; }} />
                <span style={{ display:'none', fontSize:28 }}>{c.emoji}</span>
              </div>
              <p style={{ margin:0, fontSize:11, fontWeight:600, color:'#111', lineHeight:'12px' }}>{c.name}</p>
              <span style={{ fontSize:10, color:'#6b7280' }}>{c.count} ads</span>
            </Link>
          </li>
        ))}

        <li style={{ flex:'0 0 25%', padding:'8px 2px', display:'flex', justifyContent:'center' }}>
          <button onClick={()=>setOpen(!open)} style={{ border:0, background:'none', cursor:'pointer', textAlign:'center' }}>
            <div style={{ width:60, height:60, background:'#ebf2f7', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 5px', fontSize:22 }}> {open ? '▲' : '☰'} </div>
            <p style={{ margin:0, fontSize:11, fontWeight:600, color:'#111' }}>{open ? 'Less' : 'All categories'}</p>
            <span style={{ fontSize:10, color:'#6b7280' }}>{totalAds} ads</span>
          </button>
        </li>
      </ul>
    </div>
  );
}