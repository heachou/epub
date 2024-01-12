import { useEffect, useRef, useState } from 'react'
import { ReactReader } from 'react-reader'
import type { Contents, Rendition,NavItem } from 'epubjs'

type ITheme = 'light' | 'dark'

type ITextSelection = {
  text: string
  cfiRange: string
}


function updateTheme(rendition: Rendition, theme: ITheme) {
  const themes = rendition.themes
  switch (theme) {
    case 'dark': {
      themes.override('color', '#fff')
      themes.override('background', '#000')
      break
    }
    case 'light': {
      themes.override('color', '#000')
      themes.override('background', '#fff')
      break
    }
  }
}


function App() {
  const [location, setLocation] = useState<string | number>(0)
  const rendition = useRef<Rendition | undefined>(undefined)
  const [largeText, setLargeText] = useState(false)
  const [theme, setTheme] = useState<ITheme>('dark')
  const [page, setPage] = useState('')
  const toc = useRef<NavItem[]>([])
  const [selections, setSelections] = useState<ITextSelection[]>([])

  useEffect(() => {
    rendition.current?.themes.fontSize(largeText ? '140%' : '100%')
  }, [largeText])

  useEffect(() => {
    if (rendition.current) {
      updateTheme(rendition.current, theme)
    }
  }, [theme])

  useEffect(() => {
    if (rendition.current) {
      function setRenderSelection(cfiRange: string, contents: Contents) {
        console.log('cfiRange', cfiRange)
        if (rendition.current) {
          setSelections((list) =>
            list.concat({
              text: rendition.current!.getRange(cfiRange).toString(),
              cfiRange,
            })
          )
          rendition.current?.annotations.add(
            'highlight',
            cfiRange,
            {},
            undefined,
            'hl',
            { fill: 'red', 'fill-opacity': '0.5', 'mix-blend-mode': 'multiply' }
          )
          const selection = contents.window.getSelection()
          selection?.removeAllRanges()
        }
      }
      rendition.current?.on('selected', setRenderSelection)
      return () => {
        rendition.current?.off('selected', setRenderSelection)
      }
    }
  }, [rendition.current])

  return (
    <div style={{ height: '100vh' }}>
      <div className='flex gap-x-4'>
        <button onClick={() => setLargeText(!largeText)} className="btn">
          Toggle font-size
        </button>
        <button
            onClick={() => setTheme('light')}
          >
            Light theme
          </button>
          <button
            onClick={() => setTheme('dark')}
          >
            Dark theme
          </button>
        <div>location:{location}</div>
        <div>page:{page}</div>
        <ul className="grid grid-cols-1 divide-y divide-stone-400 border-t border-stone-400 -mx-2">
            {selections.map(({ text, cfiRange }, i) => (
              <li key={i} className="p-2">
                <span>{text}</span>
                <button
                  className="underline hover:no-underline text-sm mx-1"
                  onClick={() => {
                    rendition.current?.display(cfiRange)
                  }}
                >
                  Show
                </button>

                <button
                  className="underline hover:no-underline text-sm mx-1"
                  onClick={() => {
                    rendition.current?.annotations.remove(cfiRange, 'highlight')
                    setSelections(selections.filter((_, j) => j !== i))
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
      </div>
      <ReactReader
        url="/share.epub"
        location={location}
        title='this is title'
        tocChanged={(_toc) => (toc.current = _toc)}
        epubInitOptions={{
          openAs: 'epub',
        }}
        epubOptions={{
          flow: 'scrolled',
          manager: 'continuous',
        }}

        locationChanged={(epubcfi: string) => {
          setLocation(epubcfi)
          if (rendition.current && toc.current) {
            const { displayed, href } = rendition.current.location.start
            const chapter = toc.current.find((item) => item.href === href)
            setPage(
              `Page ${displayed.page} of ${displayed.total} in chapter ${
                chapter ? chapter.label : 'n/a'
              }`
            )
          }
        }}
        getRendition={(_rendition: Rendition) => {
          rendition.current = _rendition
          _rendition.hooks.content.register((contents: Contents) => {
            const body = contents.window.document.querySelector('body')
            if (body) {
              body.oncontextmenu = () => {
                return false
              }
            }
          })
          rendition.current.themes.fontSize(largeText ? '140%' : '100%')
        }}
      />
    </div>
  )
}

export default App
