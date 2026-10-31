import { ImageResponse } from 'next/og'
import { siteConfig } from '@/config/site'
export const size={width:1200,height:630}
export const contentType='image/png'
export default function Image(){return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',padding:80,background:'#26211d',color:'#f8f3eb'}}><div style={{fontSize:28,color:'#c99b65'}}>BOUTIQUE · DISTRICT 1</div><div style={{fontSize:96,marginTop:30}}>{siteConfig.name}</div><div style={{fontSize:44,marginTop:18}}>{siteConfig.tagline.vi}</div></div>,size)}
