import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#e4312b", // Palestinian Red
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
    },
    palestine: {
      red: "#E4312B",
      green: "#149954",
      black: "#1C1C1C",
      white: "#FFFFFF",
    },
  },
  fonts: {
    heading: `'Cairo', sans-serif`,
    body: `'Cairo', 'Segoe UI', sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: "#fafafa",
        color: "palestine.black",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "bold",
        borderRadius: "lg",
        _hover: { transform: "translateY(-1px)", boxShadow: "md" },
        transition: "all 0.2s",
      },
      variants: {
        solid: {
          bg: "palestine.red",
          color: "white",
          _hover: { bg: "#c42a25" },
        },
        outline: {
          borderColor: "palestine.red",
          color: "palestine.red",
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: "xl",
          overflow: "hidden",
          boxShadow: "sm",
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderRadius: "lg",
            borderColor: "gray.200",
            _focus: { borderColor: "palestine.green", boxShadow: "0 0 0 1px #149954" },
          },
        },
      },
    },
  },
});

export default theme;