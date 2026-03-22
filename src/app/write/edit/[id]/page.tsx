import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditForm from './EditForm'

export default async function EditPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: content } = await supabase
    .from('contents')
    .select('id, title, category, excerpt, body, tags, status, file_url, file_name, cover_image_url, author_id, resubmit_count')
    .eq('id', params.id)
    .single()

  if (!content) notFound()
  if (content.author_id !== user.id) notFound()
  if (!['draft', 'revision', 'rejected'].includes(content.status)) {
    redirect('/mypage')
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10 pb-6 border-b border-primary/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Edit Entry</p>
        <h1 className="text-3xl font-serif font-bold text-primary">
          {content.status === 'revision' ? '수정 후 재제출' : '글 편집'}
        </h1>
        {content.status === 'revision' && (
          <p className="text-sm text-amber-600 mt-1 font-sans">수정 완료 후 제출하면 편집부에 다시 전달됩니다.</p>
        )}
      </div>
      <EditForm content={content} />
    </div>
  )
}
