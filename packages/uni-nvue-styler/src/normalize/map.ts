import { NormalizeOptions } from '.'
import { camelize } from '@vue/shared'
import { CssJSON, Normalize, Property, Restriction } from '../utils'
import { normalizeColor } from './color'
import { createEnumNormalize, createEnumNormalizeWithPlatform } from './enum'
import { normalizeFlexWrap } from './flexWrap'
import { normalizeInteger } from './integer'
import { normalizeLength, normalizePercent } from './length'
import { normalizeNumber } from './number'
import { normalizeShorthandLength } from './shorthandLength'
import { normalizeTransform } from './transform'
import { normalizeInterval } from './interval'
import { normalizeProperty } from './property'
import { normalizeTimingFunction } from './timingFunction'
import { createCombinedNormalize } from './combined'
import { normalizePlatform } from './platform'

export const normalizeDefault: Normalize = (v) => {
  return { value: v }
}

const NVUE_PROP_NAME_GROUPS: Record<string, Record<string, Normalize>> = {
  boxModel: {
    display: createEnumNormalize(['flex']),
    width: normalizeLength,
    height: normalizeLength,
    overflow: createEnumNormalize(['hidden']),
    padding: normalizeShorthandLength,
    paddingLeft: normalizeLength,
    paddingRight: normalizeLength,
    paddingTop: normalizeLength,
    paddingBottom: normalizeLength,
    margin: normalizeShorthandLength,
    marginLeft: normalizeLength,
    marginRight: normalizeLength,
    marginTop: normalizeLength,
    marginBottom: normalizeLength,
    borderWidth: normalizeLength,
    borderLeftWidth: normalizeLength,
    borderTopWidth: normalizeLength,
    borderRightWidth: normalizeLength,
    borderBottomWidth: normalizeLength,
    borderColor: normalizeColor,
    borderLeftColor: normalizeColor,
    borderTopColor: normalizeColor,
    borderRightColor: normalizeColor,
    borderBottomColor: normalizeColor,
    borderStyle: createEnumNormalize(['dotted', 'dashed', 'solid']),
    borderTopStyle: createEnumNormalize(['dotted', 'dashed', 'solid']),
    borderRightStyle: createEnumNormalize(['dotted', 'dashed', 'solid']),
    borderBottomStyle: createEnumNormalize(['dotted', 'dashed', 'solid']),
    borderLeftStyle: createEnumNormalize(['dotted', 'dashed', 'solid']),
    borderRadius: normalizeLength,
    borderBottomLeftRadius: normalizeLength,
    borderBottomRightRadius: normalizeLength,
    borderTopLeftRadius: normalizeLength,
    borderTopRightRadius: normalizeLength,
  },
  flexbox: {
    flex: normalizeNumber,
    flexWrap: normalizeFlexWrap,
    flexDirection: createEnumNormalize([
      'column',
      'row',
      'column-reverse',
      'row-reverse',
    ]),
    justifyContent: createEnumNormalize([
      'flex-start',
      'flex-end',
      'center',
      'space-between',
      'space-around',
    ]),
    alignItems: createEnumNormalize([
      'stretch',
      'flex-start',
      'flex-end',
      'center',
    ]),
  },
  position: {
    position: createEnumNormalize(['relative', 'absolute', 'sticky', 'fixed']),
    top: normalizeLength,
    bottom: normalizeLength,
    left: normalizeLength,
    right: normalizeLength,
    zIndex: normalizeInteger,
  },
  common: {
    opacity: normalizeNumber,
    boxShadow: normalizeDefault,
    backgroundColor: normalizeColor,
    backgroundImage: normalizeDefault,
  },
  text: {
    lines: normalizeInteger,
    color: normalizeColor,
    fontSize: normalizeLength,
    fontStyle: createEnumNormalize(['normal', 'italic']),
    fontFamily: normalizeDefault,
    fontWeight: createEnumNormalize([
      'normal',
      'bold',
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
    ]),
    textDecoration: createEnumNormalize(['none', 'underline', 'line-through']),
    textAlign: createEnumNormalize(['left', 'center', 'right']),
    textOverflow: createEnumNormalize(['clip', 'ellipsis', 'unset', 'fade']),
    lineHeight: normalizeLength,
  },
  transition: {
    transitionProperty: normalizeProperty,
    transitionDuration: normalizeInterval,
    transitionDelay: normalizeInterval,
    transitionTimingFunction: normalizeTimingFunction,
  },
  transform: {
    transform: normalizeTransform,
    transformOrigin: normalizeTransform, // fixed by xxxxxx
  },
  customized: {
    itemSize: normalizeLength,
    itemColor: normalizeColor,
    itemSelectedColor: normalizeColor,
    textColor: normalizeColor,
    timeColor: normalizeColor,
    textHighlightColor: normalizeColor,
  },
}

const uvueNormalizeMap: Record<string, Normalize> = {
  margin: normalizeShorthandLength,
  padding: normalizeShorthandLength,
  transform: normalizeTransform,
}

const restrictionMap: Partial<Record<Restriction, Normalize>> = {
  [Restriction.LENGTH]: normalizeLength,
  [Restriction.PERCENTAGE]: normalizePercent,
  [Restriction.NUMBER]: normalizeNumber,
  [Restriction.NUMBER_0_1]: normalizeNumber,
  [Restriction.COLOR]: normalizeColor,
  [Restriction.TIME]: normalizeInterval,
  [Restriction.PROPERTY]: normalizeProperty,
  [Restriction.TIMING_FUNCTION]: normalizeTimingFunction,
}

function getUVueNormalizeMap() {
  const result: Record<string, Normalize> = {}

  let cssJson: CssJSON
  try {
    // eslint-disable-next-line no-restricted-globals
    cssJson = require('../lib/css.json') as CssJSON
  } catch (e) {
    // 单元测试环境，源码目录
    // eslint-disable-next-line no-restricted-globals
    cssJson = require('../../lib/css.json') as CssJSON
  }

  const { properties } = cssJson

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i]
    const prop = camelize(property.name)
    let normalize: Normalize
    if (uvueNormalizeMap[prop]) {
      normalize = uvueNormalizeMap[prop]
    } else {
      const normalizes = getNormalizes(property)
      if (normalizes.length > 1) {
        normalize = createCombinedNormalize(normalizes)
      } else if (normalizes.length === 1) {
        normalize = normalizes[0]
      } else {
        normalize = normalizeDefault
      }
    }
    result[prop] = normalizePlatform(normalize, property.uniPlatform)
  }
  return result
}

function getNormalizes(property: Property) {
  const normalizes: Normalize[] = []
  property.restrictions.forEach((restriction) => {
    const normalize = restrictionMap[restriction]
    if (normalize) {
      normalizes.push(normalize)
    }
  })
  // enum
  if (property?.values?.length) {
    normalizes.push(createEnumNormalizeWithPlatform(property.values))
  }
  return normalizes
}

let normalizeMap: Record<string, Normalize>

export function getNormalizeMap(options: NormalizeOptions) {
  if (normalizeMap) {
    return normalizeMap
  }
  const uvue = options.type === 'uvue'
  if (uvue) {
    normalizeMap = getUVueNormalizeMap()
  } else {
    normalizeMap = Object.keys(NVUE_PROP_NAME_GROUPS).reduce<
      Record<string, Normalize>
    >((res, name) => {
      const group = NVUE_PROP_NAME_GROUPS[name]
      Object.keys(group).forEach((prop) => {
        res[prop] = group[prop]
      })
      return res
    }, {})
  }

  return normalizeMap
}
