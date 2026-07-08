import { useEffect } from 'react'
import { initMetaPixel } from '../utils/metaPixel'

export function useMetaPixel(): void {
  useEffect(() => {
    initMetaPixel()
  }, [])
}
