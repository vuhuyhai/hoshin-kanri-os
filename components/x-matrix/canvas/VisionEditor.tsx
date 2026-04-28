'use client'

import { useEffect, useState } from 'react'
import { useCanvas } from './state/CanvasContext'
import { EducationalTooltip } from './EducationalTooltip'

export function VisionEditor() {
  const { state, dispatch } = useCanvas()
  const [draft, setDraft] = useState(state.data.vision)

  useEffect(() => {
    if (state.data.vision !== draft) {
      setDraft(state.data.vision)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data.vision])

  const handleBlur = () => {
    if (draft !== state.data.vision) {
      dispatch({ type: 'SET_VISION', payload: draft })
    }
  }

  const tooShort = draft.length > 0 && draft.length < 10

  return (
    <section className="w-full border-b-[3px] border-ink bg-[var(--bg)] px-4 py-4 lg:px-8">
      <div className="mb-2 flex items-center gap-1">
        <span className="overline">🎯 Tầm nhìn dài hạn (3-5 năm)</span>
        <EducationalTooltip
          title="Tầm nhìn là gì?"
          content={
            <p>
              Vision phải breakthrough — mô tả TƯƠNG LAI muốn trở thành, KHÔNG
              phải mô tả việc đang làm. VD tốt:{' '}
              <em>&ldquo;Phòng tập số 1 cho phụ nữ Việt Nam đến 2030&rdquo;</em>. VD xấu:{' '}
              <em>&ldquo;Tiếp tục phát triển và cải thiện dịch vụ&rdquo;</em> (mơ hồ).
            </p>
          }
        />
      </div>
      <textarea
        rows={2}
        placeholder="VD: Trở thành phòng tập số 1 cho phụ nữ Việt Nam đến 2030"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        className="w-full resize-none rounded-[var(--radius-md)] border-2 border-ink bg-[var(--bg)] px-4 py-3 font-body text-base text-ink transition-all duration-100 ease-[var(--ease-nb)] placeholder:italic placeholder:text-[var(--text-3)] focus:border-[var(--brand)] focus:shadow-[3px_3px_0_var(--brand)] focus:outline-none"
      />
      {tooShort && (
        <p className="mt-1 text-xs italic text-[var(--destructive)]">
          Cần ít nhất 10 ký tự để hệ thống hiểu rõ tầm nhìn
        </p>
      )}
    </section>
  )
}
