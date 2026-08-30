import React from 'react';
const cats = [
  { name: 'Post ad', yellow: true },
  { name: 'Trending', emoji: '🔥' },
  { name: 'Vehicles', emoji: '🚗' },
  { name: 'Property', emoji: '🏠' },
  { name: 'Phones & Tablets', emoji: '📱' },
  { name: 'Electronics', emoji: '💻' },
  { name: 'Home, Furniture', emoji: '🛋️' },
  { name: 'Fashion', emoji: '👗' },
  { name: 'Beauty', emoji: '💄' },
  { name: 'Services', emoji: '🔧' },
  { name: 'Repair', emoji: '🏗️' },
  { name: 'Commercial', emoji: '⚙️' },
];
export default function BikroyMobileCategories(){
 return (
  <div style={{background:'white',padding:'0 6px'}}>
   <ul style={{display:'flex',flexWrap:'wrap',listStyle:'none',padding:0,margin:0}}>
    {cats.map((c:any)=>(
     <li key={c.name} style={{flex:'0 0 25%',display:'flex',justifyContent:'center',padding:'8px 2px'}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}}>
       <div style={{width:60,height:60,background:c.yellow?'#ffbc65':'#ebf2f7',borderRadius:8,marginBottom:5,display:'flex',alignItems:'center',justifyContent:'center'}}>
        {c.yellow?<div style={{width:40,height:40,background:'white',borderRadius:999,display:'flex',alignItems:'center',justifyContent:'center',color:'#ffbc65',fontSize:24,fontWeight:'bold'}}>+</div>:<span style={{fontSize:28}}>{c.emoji}</span>}
       </div>
       <p style={{color:'#28363e',fontSize:11,lineHeight:'13px',fontWeight:500,margin:0,textAlign:'center'}}>{c.name}</p>
      </div>
     </li>
    ))}
   </ul>
  </div>
 )
}