import React from 'react';
const cats = [
  { name: 'Post ad', yellow: true },
  { name: 'Trending', emoji: '🔥' },
  { name: 'Vehicles', img: '/icons/categories/vehicles_transparent.png', href: '/c/vehicles' },
  { name: 'Property', img: '/icons/categories/property.png', href: '/c/property' },
  { name: 'Phones & Tablets', img: '/icons/categories/phones.png', href: '/c/phones' },
  { name: 'Electronics', img: '/icons/categories/electronics_transparent.png', href: '/c/electronics' },
  { name: 'Home, Furniture & Appliances', img: '/icons/categories/home.png', href: '/c/home' },
  { name: 'Fashion', img: '/icons/categories/fashion.png', href: '/c/fashion' },
  { name: 'Beauty & Personal Care', img: '/icons/categories/beauty.png', href: '/c/beauty' },
  { name: 'Services', img: '/icons/categories/services_transparent.png', href: '/c/services' },
  { name: 'Repair & Construction', img: '/icons/categories/repair.png', href: '/c/repair' },
  { name: 'Commercial Equipment & Tools', img: '/icons/categories/commercial.png', href: '/c/commercial' },
];
export default function BikroyMobileCategories(){
 return (
  <div className="bg-white block md:hidden" style={{padding:'0 6px'}}>
   <ul className="flex flex-wrap list-none p-0 m-0">
    {cats.map(c=>(
     <li key={c.name} className="bg-white cursor-pointer" style={{flex:'0 0 25%', display:'flex', justifyContent:'center', padding:'8px 2px'}}>
      <a href={c.href || '#'} className="flex flex-col items-center text-center no-underline">
       <div style={{width:60,height:60,background:c.yellow?'#ffbc65':'#ebf2f7',borderRadius:8,marginBottom:5,display:'flex',alignItems:'center',justifyContent:'center'}}>
        {c.yellow ? <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#ffbc65] text-2xl font-bold">+</div>
        : c.emoji ? <span style={{fontSize:30}}>{c.emoji}</span>
        : <img src={c.img} alt={c.name} style={{width:'100%',maxWidth:60,maxHeight:60,objectFit:'contain',opacity:1}}/>}
       </div>
       <p style={{letterSpacing:.4,color:'#28363e',fontSize:12,lineHeight:'16px',fontWeight:400,maxHeight:'2.4em',overflow:'hidden',margin:0}}>{c.name}</p>
      </a>
     </li>
    ))}
   </ul>
  </div>
 )
}