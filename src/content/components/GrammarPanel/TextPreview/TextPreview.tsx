import { Segment } from '../../../utils/segments'

interface TextPreviewProps {
  segments: Segment[]
}

export function TextPreview({ segments }: TextPreviewProps) {
  const errorSegs = segments.filter((s) => s.error)
  return (
    <div className="text-preview">
      <div className="text-body">
        {segments.map((seg, i) =>
          seg.error ? (
            <span key={i} className="error-group">
              <mark className="error-highlight">{seg.text}</mark>
              <span className="error-annotation"> → {seg.error.replacement}</span>
            </span>
          ) : (
            seg.text
          )
        )}
      </div>
      {errorSegs.length > 0 && (
        <ul className="error-list">
          {errorSegs.map((seg, i) => (
            <li key={i} className="error-item">
              <div className="error-item-header">
                <span className="error-item-word">{seg.text}</span>
                <span className="error-item-arrow">→</span>
                <span className="error-item-fix">{seg.error!.replacement}</span>
              </div>
              {seg.error!.message && <p className="error-item-reason">{seg.error!.message}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
