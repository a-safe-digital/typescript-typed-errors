export type CodePathSegment = {
  id: string
  nextSegments: CodePathSegment[]
  prevSegments: CodePathSegment[]
  reachable: boolean
}

export type CodePath = {
  id: string
  origin: 'program' | 'function' | 'class-field-initializer' | 'class-static-block'
  initialSegment: CodePathSegment[]
  finalSegments: CodePathSegment[]
  currentSegments: CodePathSegment[]
  returnedSegments: CodePathSegment[]
  thrownSegments: CodePathSegment[]
  upper: CodePath | null
  childCodePaths: CodePath[]
}

