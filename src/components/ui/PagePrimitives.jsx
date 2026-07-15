import React from 'react'

export function InfoCard({ title, text, className = 'info-card card' }) {
  return (
    <article className={className}>
      <p className="eyebrow">{title}</p>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}

export function MinimalList({ items, className = 'mini-list' }) {
  return (
    <div className={className}>
      {items.map((item) => <div key={item}><span>{item}</span></div>)}
    </div>
  )
}
