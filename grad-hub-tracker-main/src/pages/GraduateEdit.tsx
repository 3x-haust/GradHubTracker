import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useGraduates } from "@/stores/graduates"
import { GraduateRecord } from "@/lib/types"
import GraduateEditForm from "@/components/forms/GraduateEditForm"

export default function GraduateEdit() {
  const { id } = useParams()
  const grads = useGraduates()
  const [record, setRecord] = useState<GraduateRecord | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      if (!id) return
      try {
        const g = await grads.get(id)
        setRecord(g)
      } catch {
        setRecord(null)
      }
    })()
  }, [id, grads])

  if (!record) return <div className="p-6 text-muted-foreground">데이터를 불러오는 중…</div>

  return <GraduateEditForm record={record} onBack={() => navigate(-1)} />
}
