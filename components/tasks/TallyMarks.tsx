interface TallyMarksProps {
  count: number
  color?: string
}

function TallyGroup({ isDiagonal }: { isDiagonal?: boolean }) {
  return (
    <svg width="32" height="24" viewBox="0 0 32 24" className="inline-block">
      {/* 4 vertical marks */}
      <line x1="4" y1="2" x2="4" y2="22" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
      <line x1="10" y1="2" x2="10" y2="22" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
      <line x1="16" y1="2" x2="16" y2="22" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
      <line x1="22" y1="2" x2="22" y2="22" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
      {/* diagonal strike through all 4 */}
      {isDiagonal && (
        <line x1="1" y1="20" x2="26" y2="4" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
      )}
    </svg>
  )
}

function SingleMark() {
  return (
    <svg width="8" height="24" viewBox="0 0 8 24" className="inline-block">
      <line x1="4" y1="2" x2="4" y2="22" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
    </svg>
  )
}

export function TallyMarks({ count, color }: TallyMarksProps) {
  const groups = Math.floor(count / 5)
  const remainder = count % 5

  if (count === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">No hours logged yet</span>
    )
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      style={{ color: color ?? 'currentColor' }}
      aria-label={`${count} tally marks`}
    >
      {Array.from({ length: groups }).map((_, i) => (
        <TallyGroup key={i} isDiagonal />
      ))}
      {Array.from({ length: remainder }).map((_, i) => (
        <SingleMark key={i} />
      ))}
      <span className="text-xs font-medium ml-1 text-muted-foreground">({count})</span>
    </div>
  )
}
