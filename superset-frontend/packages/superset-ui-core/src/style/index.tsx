/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import emotionStyled from '@emotion/styled';
import { useTheme as useThemeBasic } from '@emotion/react';
import createCache from '@emotion/cache';

export {
  css,
  keyframes,
  jsx,
  ThemeProvider,
  CacheProvider as EmotionCacheProvider,
  withTheme,
  type SerializedStyles,
} from '@emotion/react';
export { default as createEmotionCache } from '@emotion/cache';

declare module '@emotion/react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Theme extends SupersetTheme {}
}

export function useTheme() {
  const theme = useThemeBasic();
  // in the case there is no theme, useTheme returns an empty object
  if (Object.keys(theme).length === 0 && theme.constructor === Object) {
    throw new Error(
      'useTheme() could not find a ThemeContext. The <ThemeProvider/> component is likely missing from the app.',
    );
  }
  return theme;
}

export const emotionCache = createCache({
  key: 'superset',
});

export const styled = emotionStyled;

const defaultTheme = {
  borderRadius: 4,
  colors: {
    text: {
      label: '#798899', // Darker for better readability
      help: '#798899',
    },
    primary: {
      base: '#495B6D', // Your main brand blue
      dark1: '#5B67D6', // Darker for hover/active states
      dark2: '#192C47',
      light1: '#798899', // Lighter for subtle interactions
      light2: '#A8B3C1',
      light3: '#CBD5E1',
      light4: '#E6ECF2',
      light5: '#F1F5F9',
    },
    secondary: {
      base: '#444E7C',
      dark1: '#363E63',
      dark2: '#282E4A',
      dark3: '#1B1F31',
      light1: '#E1E5F8',
      light2: '#B4B8CA',
      light3: '#D9DBE4',
      light4: '#ECEEF2',
      light5: '#F8FAFC',
    },
    orange: {
      base: '#FFF7E9',
      light1: '#EAA776',
      light2: '#EDBA8D',
    },
    grayscale: {
      base: '#051938', // Default text color
      dark1: '#192C47', // Darker backgrounds for contrast
      dark2: '#051938', // Even darker for depth
      light1: '#A8B3C1', // Muted text color
      light2: '#CBD5E1', // Disabled element background
      light3: '#E6ECF2', // Inputs & dropdowns
      light4: '#F1F5F9', // Lighter backgrounds
      light5: '#FFFFFF', // White
    },
    disabled: {
      base: '#CBD5E1', // Better contrast for disabled buttons
      text: 'black', // Darker for readability
      border: '#A8B3C1',
    },
    error: {
      base: '#E63946',
      dark1: '#A7323F',
      dark2: '#6F212A',
      light1: '#EFA1AA',
      light2: '#FAEDEE',
    },
    warning: {
      base: '#E9C46A',
      dark1: '#BC9501',
      dark2: '#7D6300',
      light1: '#FDE380',
      light2: '#FEF9E6',
    },
    success: {
      base: '#2A9D8F',
      dark1: '#1B6F64',
      dark2: '#134D45',
      light1: '#ACE1C4',
      light2: '#EEF8F3',
    },
    info: {
      base: '#457B9D',
      dark1: '#2E5671',
      dark2: '#1E3A4B',
      light1: '#A5CBE5',
      light2: '#E5F3FA',
    },
  },
  opacity: {
    light: '10%',
    mediumLight: '35%',
    mediumHeavy: '60%',
    heavy: '80%',
  },
  typography: {
    families: {
      sansSerif: `'Inter', Helvetica, Arial`,
      serif: `Georgia, 'Times New Roman', Times, serif`,
      monospace: `'Fira Code', 'Courier New', monospace`,
    },
    weights: {
      light: 200,
      normal: 400,
      medium: 500,
      bold: 600,
    },
    sizes: {
      xxs: 9,
      xs: 10,
      s: 12,
      m: 14,
      l: 16,
      xl: 21,
      xxl: 28,
    },
  },
  zIndex: {
    aboveDashboardCharts: 10,
    dropdown: 11,
    max: 3000,
  },
  transitionTiming: 0.3,
  gridUnit: 4,
  brandIconMaxWidth: 37,
};

export type SupersetTheme = typeof defaultTheme;

export interface SupersetThemeProps {
  theme: SupersetTheme;
}

export const supersetTheme = defaultTheme;
