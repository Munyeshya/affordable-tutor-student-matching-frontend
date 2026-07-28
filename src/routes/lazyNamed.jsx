import React, { lazy } from 'react'

export function lazyNamed(importer, exportName) {
  return lazy(() => importer().then((module) => ({ default: module[exportName] })))
}
