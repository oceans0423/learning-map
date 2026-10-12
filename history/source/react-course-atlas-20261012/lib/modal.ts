/** Isolate all sibling branches up to body, retaining pre-existing inert states. */
export function isolateModal(element: HTMLElement) {
  const previous = new Map<HTMLElement, boolean>()
  let branch: HTMLElement | null = element
  while (branch?.parentElement) {
    const parent: HTMLElement = branch.parentElement
    for (const sibling of parent.children) {
      if (sibling !== branch && sibling instanceof HTMLElement) {
        previous.set(sibling, sibling.inert)
        sibling.inert = true
      }
    }
    if (parent === document.body) break
    branch = parent
  }
  return () => {
    for (const [node, inert] of previous) node.inert = inert
  }
}
