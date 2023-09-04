import type { OutputAsset } from 'rollup'
import type { Plugin } from 'vite'
import { ENTRY_FILENAME, getUniCloudSpaceList } from './utils'

const uniCloudSpaceList = getUniCloudSpaceList()

export function uniCloudPlugin(): Plugin {
  return {
    name: 'uni:app-unicloud',
    apply: 'build',
    generateBundle(_, bundle) {
      if (
        uniCloudSpaceList.length === 0 &&
        process.env.NODE_ENV === 'production'
      ) {
        return
      }
      if (bundle[ENTRY_FILENAME]) {
        const asset = bundle[ENTRY_FILENAME] as OutputAsset
        asset.source =
          asset.source +
          `
import "io.dcloud.unicloud.InternalUniCloudConfig"
export class UniCloudConfig extends InternalUniCloudConfig {
    override isDev : boolean = ${
      process.env.NODE_ENV === 'development' ? 'true' : 'false'
    }
    override spaceList : string = ${JSON.stringify(
      JSON.stringify(
        uniCloudSpaceList.map((item) => {
          const itemCopy = { ...item }
          delete itemCopy.workspaceFolder
          return itemCopy
        })
      )
    )}
    override debuggerInfo ?: string = ${JSON.stringify(
      process.env.UNICLOUD_DEBUG || null
    )}
    override secureNetworkEnable : boolean = false
    override secureNetworkConfig ?: string = ""
    constructor() {}
}
`
      }
    },
  }
}