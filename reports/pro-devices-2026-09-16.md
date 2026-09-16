# Visual Review: `/pro/devices` (PR #16778)

**PR:** https://github.com/canonical/ubuntu.com/pull/16778  
**Author:** @fasih-mehmood  
**Demo:** https://ubuntu-com-16778.demos.haus/pro/devices  
**Figma:** https://www.figma.com/design/KvEu5edi1zzPFyaWM4C74B/ubuntu.com-pro---Sites?node-id=174-2293  

---

## Review Draft (posted to issue #4)

Thanks for your work on this page @fasih-mehmood!

Comments:

**General:**
- [ ] I wasn't able to machine-compare the Figma frame from this environment, so this still needs a little human-eye pass against node `174-2293` for final spacing / fidelity.

**Hero / CTA links**
- [ ] I think the in-page CTAs might be dead-ending at the moment — I could see `#get-in-touch` used from the hero, tiered list and CTA strip, but I couldn't find a rendered `id="get-in-touch"` target in the DOM. Could we hook those up pls, just so the main action on the page lands somewhere?

Overall: comment — the page looks structurally solid in the responsive screenshots I could capture, but I'd want the CTA target fixed and a manual Figma pass before approval.

---

## Background Notes

**Checks passed:**
- Theme/background: correct (`is-paper`), applied via Vanilla class
- Typography: Ubuntu font loaded and in use
- Accent usage: orange restrained and appropriate
- Macro usage: full-canonical stack (vf_hero, vf_divided_section, vf_basic_section, vf_quote_wrapper, vf_tiered_list, vf_logo_section, vf_cta_section, vf_resources)
- Spacing hierarchy: sections use correct classes; last section has deep spacing
- Responsive layout: no overflow/overlap at 375px / 768px / 1280px
- Image sizing: compliance image at 3:2 aspect ratio, proportionate across breakpoints
- Asset URLs: all from Canonical/Ubuntu assets server

**Flagged items:**
- No Figma MCP available in this environment — final spacing/layout still needs human comparison against node 174-2293
- CTA anchor `#get-in-touch` referenced but not rendered in template — needs to be added or hooked up
- (Non-visual, cuttable: one inline `white-space:nowrap` style in quote title; missing `alt` on compliance image)

**Screenshot status:** Playwright captured responsive views successfully after installing deps (cookie banner dismissed for clean rendering)
