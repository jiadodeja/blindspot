// Plain words for the most common accessibility problems.
// axe-core writes its titles for experts, so here we say the same thing in everyday words.
// If a rule is not in this list, we use axe's own text.
import type { A11yIssue } from '../shared/messages'

type Words = { title: string; detail: string }

const imageNoText: Words = {
  title: 'Image has no description',
  detail: 'A screen reader cannot tell what this picture shows.',
}

const RULES: Record<string, Words> = {
  'image-alt': imageNoText,
  'role-img-alt': imageNoText,
  'svg-img-alt': imageNoText,
  'input-image-alt': {
    title: 'Image button has no description',
    detail: 'A screen reader cannot tell what this button does.',
  },
  'color-contrast': {
    title: 'Text is hard to read',
    detail: 'The text color is too close to the background color.',
  },
  'button-name': {
    title: 'Button has no label',
    detail: 'A screen reader cannot tell what this button does.',
  },
  'link-name': {
    title: 'Link has no name',
    detail: 'A screen reader cannot tell where this link goes.',
  },
  'link-in-text-block': {
    title: 'Link is hard to spot in text',
    detail: 'Links inside text need more than color to stand out.',
  },
  label: {
    title: 'Form field has no label',
    detail: 'People cannot tell what to type in this field.',
  },
  'select-name': {
    title: 'Dropdown has no label',
    detail: 'People cannot tell what this dropdown is for.',
  },
  'html-has-lang': {
    title: 'Page language is not set',
    detail: 'A screen reader needs to know what language the page is in.',
  },
  'html-lang-valid': {
    title: 'Page language is wrong',
    detail: 'The language code on the page is not valid, so a screen reader may use the wrong voice.',
  },
  'document-title': {
    title: 'Page has no title',
    detail: 'The page needs a title so people know where they are.',
  },
  'frame-title': {
    title: 'Embedded frame has no title',
    detail: 'A screen reader cannot tell what this part of the page is.',
  },
  'meta-viewport': {
    title: 'Zooming is turned off',
    detail: 'People with low vision need to be able to zoom in.',
  },
  bypass: {
    title: 'No way to skip the menu',
    detail: 'Keyboard users have to tab through the whole menu to reach the page.',
  },
  'video-caption': {
    title: 'Video has no captions',
    detail: 'People who cannot hear the video need captions.',
  },
  'scrollable-region-focusable': {
    title: 'Scrolling area cannot be reached by keyboard',
    detail: 'People who do not use a mouse cannot scroll this part.',
  },
  'nested-interactive': {
    title: 'Buttons or links inside each other',
    detail: 'A control inside another control confuses screen readers.',
  },
  'aria-hidden-focus': {
    title: 'Hidden item can still be tabbed to',
    detail: 'Keyboard users can land on something a screen reader cannot see.',
  },
  'aria-allowed-attr': {
    title: 'Wrong accessibility attribute',
    detail: 'This element uses an aria attribute it is not allowed to have.',
  },
  'aria-required-attr': {
    title: 'Missing accessibility attribute',
    detail: 'This element needs one more aria attribute to work with a screen reader.',
  },
  'aria-valid-attr-value': {
    title: 'Accessibility attribute has a bad value',
    detail: 'An aria attribute points to something that does not exist or is not valid.',
  },
  'aria-valid-attr': {
    title: 'Accessibility attribute is misspelled',
    detail: 'This aria attribute name is not a real one.',
  },
  'aria-roles': {
    title: 'Unknown role',
    detail: 'The role on this element is not a real one.',
  },
  list: {
    title: 'List is built the wrong way',
    detail: 'A list holds something that does not belong in a list.',
  },
  listitem: {
    title: 'List item is outside a list',
    detail: 'A list item should always sit inside a list.',
  },
}

export function plainRule(issue: A11yIssue): Words {
  return RULES[issue.ruleId] ?? { title: issue.help, detail: issue.description }
}
