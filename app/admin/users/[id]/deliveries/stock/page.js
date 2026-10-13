'use client'
import { useParams } from 'next/navigation'
import StockPanel from '../../../../../../components/shared/StockPanel'

export default function AdminUserStockPage() {
  const { id } = useParams()
  return <StockPanel userId={id} />
}
