/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
/**
 * List of available font names (visit the url `/settings/appearance`).
 * This array is used to generate the dynamic font class on the document root.
 *
 * 📝 How to Add a New Font (Tailwind v4+):
 * 1. Add the font name here.
 * 2. Add the self-hosted `@font-face` declaration to `styles/fonts.css`.
 * 3. Add the font family to 'theme.css' using the `@theme inline` CSS variable.
 *
 * Example:
 * fonts.ts           → Add 'roboto' to this array.
 * fonts.css          → Add the local `@font-face` for Roboto.
 * theme.css          → Add the new font in the CSS, e.g.:
 *   @theme inline {
 *      // ... other font families
 *      --font-roboto: 'Roboto', var(--font-sans);
 *   }
 */
export const fonts = ['maple'] as const
