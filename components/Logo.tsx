'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Logo() {
  const [mounted, setMounted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/24a24cf4-1961-4c08-bb87-a79a77563728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Logo.tsx:18',message:'Component mounted',data:{mounted:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    setMounted(true)
  }, [])

  const handleImageError = (event: any) => {
    // Next.js Image onError receives a SyntheticEvent, extract target details
    const target = event?.target || event?.currentTarget
    const errorDetails = {
      eventType: event?.type,
      targetSrc: target?.src,
      targetCurrentSrc: target?.currentSrc,
      targetNaturalWidth: target?.naturalWidth,
      targetNaturalHeight: target?.naturalHeight,
      targetComplete: target?.complete,
      targetError: target?.error,
      targetNodeName: target?.nodeName,
      eventKeys: event ? Object.keys(event) : [],
      targetKeys: target ? Object.keys(target) : [],
    }
    // #region agent log
              fetch('http://127.0.0.1:7242/ingest/24a24cf4-1961-4c08-bb87-a79a77563728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Logo.tsx:23',message:'Image error handler triggered',data:{errorDetails,expectedSrc:'/logo.svg'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A,C'})}).catch(()=>{});
    // #endregion
    
    // Also check if we can access the image file directly
    fetch('/logo.svg', { method: 'HEAD' })
      .then(response => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/24a24cf4-1961-4c08-bb87-a79a77563728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Logo.tsx:40',message:'Image file accessibility check',data:{status:response.status,statusText:response.statusText,ok:response.ok,headers:Object.fromEntries(response.headers)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      })
      .catch(fetchError => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/24a24cf4-1961-4c08-bb87-a79a77563728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Logo.tsx:45',message:'Image file fetch failed',data:{error:fetchError?.message,type:fetchError?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      })
    
    setImageError(true)
    setLoadState('error')
  }

  const handleLoadStart = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/24a24cf4-1961-4c08-bb87-a79a77563728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Logo.tsx:30',message:'Image load started',data:{src:'/logo.png',mounted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion
    setLoadState('loading')
  }

  const handleLoadComplete = (event: any) => {
    const target = event?.target || event?.currentTarget
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/24a24cf4-1961-4c08-bb87-a79a77563728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Logo.tsx:62',message:'Image load completed successfully',data:{src:'/logo.svg',targetSrc:target?.src,naturalWidth:target?.naturalWidth,naturalHeight:target?.naturalHeight,complete:target?.complete},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    setLoadState('loaded')
  }

  // #region agent log
  useEffect(() => {
    if (mounted) {
      fetch('http://127.0.0.1:7242/ingest/24a24cf4-1961-4c08-bb87-a79a77563728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Logo.tsx:43',message:'Render state check',data:{mounted,imageError,loadState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
  }, [mounted, imageError, loadState]);
  // #endregion

  useEffect(() => {
    if (mounted) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/24a24cf4-1961-4c08-bb87-a79a77563728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Logo.tsx:78',message:'Rendering Image component',data:{src:'/logo.png',width:192,height:40,unoptimized:true,priority:true,error:imageError,loadState},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
  }, [mounted, imageError, loadState])

  return (
    <Link href="/" className="flex items-center">
      {!imageError ? (
        <>
          {/* Try regular img tag first to test if file is valid */}
          <img
            src="/logo.svg"
            alt="Café Directory"
            className="h-12 w-auto object-contain"
            onError={(e) => {
              // #region agent log
              const target = e.target as HTMLImageElement
              fetch('http://127.0.0.1:7242/ingest/24a24cf4-1961-4c08-bb87-a79a77563728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Logo.tsx:92',message:'Regular img tag error',data:{src:target?.src,naturalWidth:target?.naturalWidth,naturalHeight:target?.naturalHeight,complete:target?.complete},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              handleImageError(e)
            }}
            onLoad={(e) => {
              // #region agent log
              const target = e.target as HTMLImageElement
              fetch('http://127.0.0.1:7242/ingest/24a24cf4-1961-4c08-bb87-a79a77563728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Logo.tsx:100',message:'Regular img tag loaded successfully',data:{src:target?.src,naturalWidth:target?.naturalWidth,naturalHeight:target?.naturalHeight,complete:target?.complete},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              handleLoadComplete(e)
            }}
            style={{ display: 'block' }}
          />
        </>
      ) : (
        <span className="text-xl font-bold text-gray-900">Café Directory</span>
      )}
    </Link>
  )
}
