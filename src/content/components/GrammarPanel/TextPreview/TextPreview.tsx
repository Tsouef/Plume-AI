import { Segment } from '../../../utils/segments'

interface TextPreviewProps {
  segments: Segment[]
}

export function TextPreview({ segments }: TextPreviewProps) {
  return (
    <div className="text-preview">
      {segments.map((seg, i) =>
        seg.error ? (
          <mark
            key={i}
            className="error-highlight"
            title={`${seg.error.message} → ${seg.error.replacement}`}
          >
            {seg.text}
          </mark>
        ) : (
          seg.text
        )
      )}
    </div>
  )
}
