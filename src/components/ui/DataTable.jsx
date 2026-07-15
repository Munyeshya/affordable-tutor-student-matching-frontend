import React from 'react'

export function DataTable({ columns, rows, rowKey = 'id', caption, className = '' }) {
  return (
    <div
      className={'ui-data-table-wrap ' + className}
      role="region"
      aria-label={caption || 'Scrollable data table'}
      tabIndex={0}
    >
      <table className="ui-data-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.header}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={typeof rowKey === 'function' ? rowKey(row, rowIndex) : row[rowKey]}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row, rowIndex) : row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
