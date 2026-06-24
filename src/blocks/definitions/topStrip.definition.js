import topStripHudIcon from '../../assets/admin-block-icons/top-strip.svg';
import { getTokenSwatch } from '../../lib/colorSystem';
import { buildDynamicTopStripFromBlock } from '../../lib/dynamicPageBlocks';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField } from '../foundation/editorDescriptors';

const TOP_STRIP_BG_OPTIONS = [
  { value: 'sand', label: 'Sand', swatch: 'linear-gradient(147deg, rgb(242, 238, 235) 62%, rgb(218, 215, 208) 100%)' },
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'blue', label: 'Blue', swatch: getTokenSwatch('blue') },
  { value: 'grey', label: 'Grey', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
];

const TOP_STRIP_TEXT_OPTIONS = [
  { value: 'super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #d8423c 100%)' },
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];

const TOP_STRIP_LOGIN_TONE_OPTIONS = [
  { value: 'atlantean', label: 'Blue', swatch: '#00adbb' },
  { value: 'super-grey', label: 'Grey', swatch: '#414042' },
];

const TOP_STRIP_RATES_TONE_OPTIONS = [
  { value: 'mango', label: 'Mango', swatch: '#f6b146' },
  { value: 'atlantean', label: 'Blue', swatch: '#00adbb' },
  { value: 'melon', label: 'Melon', swatch: '#f48f7a' },
  { value: 'super-grey', label: 'Super Grey', swatch: '#414042' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
];

const sections = [
  {
    id: 'strip',
    title: 'Strip',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'showLogin', label: 'Show login', type: 'boolean' }),
      defineEditorField({ id: 'showPhone', label: 'Show phone', type: 'boolean' }),
      defineEditorField({ id: 'showRates', label: 'Show rates link', type: 'boolean' }),
      defineEditorField({
        id: 'bgTone',
        label: 'Background color',
        type: 'swatch',
        compact: true,
        iconOnly: true,
        options: TOP_STRIP_BG_OPTIONS,
      }),
      defineEditorField({
        id: 'textTone',
        label: 'Base text color',
        type: 'swatch',
        compact: true,
        iconOnly: true,
        options: TOP_STRIP_TEXT_OPTIONS,
      }),
      defineEditorField({ id: 'sectionFontSizeRem', label: 'Section font size (rem)', type: 'number', min: 0.7, max: 1.3, step: 0.05 }),
      defineEditorField({ id: 'itemGapRem', label: 'Item gap (rem)', type: 'number', min: 0.6, max: 2, step: 0.05 }),
    ],
  },
  {
    id: 'login',
    title: 'Secure Login',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'loginLabel', label: 'Login label', type: 'text' }),
      defineEditorField({ id: 'loginHref', label: 'Login URL', type: 'text' }),
      defineEditorField({ id: 'loginOpenInNewWindow', label: 'Login opens in new window', type: 'boolean' }),
      defineEditorField({
        id: 'loginButtonStyle',
        label: 'Login button style',
        type: 'select',
        options: [
          { value: 'solid', label: 'Solid' },
          { value: 'outline', label: 'Outline' },
        ],
      }),
      defineEditorField({
        id: 'loginButtonTone',
        label: 'Login button color',
        type: 'swatch',
        compact: true,
        iconOnly: true,
        options: TOP_STRIP_LOGIN_TONE_OPTIONS,
      }),
    ],
  },
  {
    id: 'contact',
    title: 'Phone + Rates',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'phone', label: 'Phone number', type: 'text' }),
      defineEditorField({ id: 'ratesLabel', label: 'Rates label', type: 'text' }),
      defineEditorField({ id: 'ratesPath', label: 'Rates path', type: 'text' }),
      defineEditorField({ id: 'ratesOpenInNewWindow', label: 'Rates opens in new window', type: 'boolean' }),
      defineEditorField({
        id: 'ratesButtonStyle',
        label: 'Rates button style',
        type: 'select',
        options: [
          { value: 'link', label: 'Link' },
          { value: 'solid', label: 'Solid' },
          { value: 'outline', label: 'Outline' },
        ],
      }),
      defineEditorField({
        id: 'ratesButtonTone',
        label: 'Rates link color',
        type: 'swatch',
        compact: true,
        iconOnly: true,
        options: TOP_STRIP_RATES_TONE_OPTIONS,
      }),
    ],
  },
];

export const topStripBlockDefinition = createBlockDefinition({
  kind: 'top_strip',
  label: 'Top Strip',
  icon: topStripHudIcon,
  editorType: 'top_strip',
  singleton: true,
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    showLogin: true,
    loginLabel: 'Secure Login',
    loginHref: 'https://secure.agfinancial.org/',
    showPhone: true,
    phone: '866.621.1787',
    showRates: true,
    ratesLabel: 'Ask about our rates!',
    ratesPath: '/rates',
    bgTone: 'grey',
    textTone: 'white',
    sectionFontSizeRem: 0.95,
    itemGapRem: 0.95,
    loginButtonStyle: 'solid',
    loginButtonTone: 'atlantean',
    loginOpenInNewWindow: true,
    ratesButtonStyle: 'link',
    ratesButtonTone: 'mango',
    ratesOpenInNewWindow: false,
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicTopStripFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['strip', 'login', 'contact'],
    adminSectionIds: ['strip', 'login', 'contact'],
  },
  validators: [
    (block) => Boolean(buildDynamicTopStripFromBlock(block)),
  ],
  styleScope: {
    rootClassName: 'home-native-strip',
    cssNamespace: 'top-strip',
  },
});
