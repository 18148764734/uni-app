import path from 'path'
import fs from 'fs-extra'
import {
  PAGES_JSON_UTS,
  normalizeAppPagesJson,
  normalizeUniAppXAppPagesJson,
} from '@dcloudio/uni-cli-shared'
import type { Plugin } from 'vite'
import { isPages } from '../utils'

export function uniAppPagesPlugin(): Plugin {
  const pagesJsonPath = path.resolve(process.env.UNI_INPUT_DIR, 'pages.json')
  const pagesJsonUTSPath = path.resolve(
    process.env.UNI_INPUT_DIR,
    PAGES_JSON_UTS
  )

  return {
    name: 'uni:app-pages',
    apply: 'build',
    resolveId(id) {
      if (isPages(id)) {
        return pagesJsonUTSPath
      }
    },
    load(id) {
      if (isPages(id)) {
        return fs.readFileSync(pagesJsonPath, 'utf8')
      }
    },
    transform(code, id) {
      if (isPages(id)) {
        this.addWatchFile(path.resolve(process.env.UNI_INPUT_DIR, 'pages.json'))
        const pagesJson = normalizeUniAppXAppPagesJson(code)
        return normalizeAppPagesJson(pagesJson)
      }
    },
  }
}
