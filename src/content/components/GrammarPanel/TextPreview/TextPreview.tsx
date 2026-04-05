import { Segment } from '../../../utils/segments'

interface TextPreviewProps {
  segments: Segment[]
}

export function TextPreview({ segments }: TextPreviewProps) {
  return (
    <div className="text-preview">
      {segments.map((seg, i) =>
        seg.error ? (
          <span key={i} className="error-group">
            <mark className="error-highlight">{seg.text}</mark>
            <span className="error-annotation"> → {seg.error.replacement}</span>
            <span className="error-reason">{seg.error.message}</span>
          </span>
        ) : (
          seg.text
        )
      )}
    </div>
  )
}
