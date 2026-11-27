import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Páginas do Cozinha Gourmet moram em programacozinhagourmet.com.br.
    // Os endereços antigos em agenteorbiia.com continuam valendo e redirecionam (QR codes, links já enviados).
    // Só páginas: imagens, vídeos e o doc.css continuam servidos onde estão.
    const CG = "https://www.programacozinhagourmet.com.br";
    const orbi = [{ type: "host" as const, value: "(www\\.)?agenteorbiia\\.com" }];
    const novo = [{ type: "host" as const, value: "(www\\.)?programacozinhagourmet\\.com\\.br" }];
    const paginas = "fotos|checkin|confirmar|patrocinio|parceria|trama|episodio2|videos|direitos";
    return [
      { source: "/cozinhagourmet", has: orbi, destination: `${CG}/`, permanent: true },
      { source: "/cozinhagourmet/site", has: orbi, destination: `${CG}/`, permanent: true },
      { source: `/cozinhagourmet/:pagina(${paginas})`, has: orbi, destination: `${CG}/:pagina`, permanent: true },
      { source: "/cozinhagourmet/contrato", has: orbi, destination: `${CG}/contrato`, permanent: true },
      { source: "/cozinhagourmet/contrato/:sub(admin|novo)", has: orbi, destination: `${CG}/contrato/:sub`, permanent: true },
      // no domínio novo, endereço curto
      { source: "/cozinhagourmet", has: novo, destination: "/", permanent: true },
      { source: "/cozinhagourmet/site", has: novo, destination: "/", permanent: true },
      { source: `/cozinhagourmet/:pagina(${paginas})`, has: novo, destination: "/:pagina", permanent: true },
      { source: "/cozinhagourmet/contrato", has: novo, destination: "/contrato", permanent: true },
      { source: "/cozinhagourmet/contrato/:sub(admin|novo)", has: novo, destination: "/contrato/:sub", permanent: true },
    ];
  },
  async rewrites() {
    // Domínio próprio do programa: programacozinhagourmet.com.br (com e sem www)
    const cg = [{ type: "host" as const, value: "(www\\.)?programacozinhagourmet\\.com\\.br" }];
    const beforeFiles = [
      { source: "/", has: cg, destination: "/cozinhagourmet/site/index.html" },
      { source: "/favicon.ico", has: cg, destination: "/cozinhagourmet/favicon.ico" },
      { source: "/fotos", has: cg, destination: "/cozinhagourmet/fotos/index.html" },
      { source: "/checkin", has: cg, destination: "/cozinhagourmet/checkin/index.html" },
      { source: "/confirmar", has: cg, destination: "/cozinhagourmet/confirmar/index.html" },
      { source: "/patrocinio", has: cg, destination: "/cozinhagourmet/patrocinio/index.html" },
      { source: "/parceria", has: cg, destination: "/cozinhagourmet/parceria/index.html" },
      { source: "/trama", has: cg, destination: "/cozinhagourmet/trama/index.html" },
      { source: "/videos", has: cg, destination: "/cozinhagourmet/videos/index.html" },
      { source: "/direitos", has: cg, destination: "/cozinhagourmet/direitos/index.html" },
      { source: "/episodio2", has: cg, destination: "/cozinhagourmet/episodio2/index.html" },
      { source: "/contrato", has: cg, destination: "/cozinhagourmet/contrato/index.html" },
      { source: "/contrato/admin", has: cg, destination: "/cozinhagourmet/contrato/admin.html" },
      { source: "/contrato/novo", has: cg, destination: "/cozinhagourmet/contrato/novo.html" },
    ];
    const afterFiles = [
      { source: "/cozinhagourmet/site", destination: "/cozinhagourmet/site/index.html" },
      { source: "/cozinhagourmet/videos", destination: "/cozinhagourmet/videos/index.html" },
      { source: "/cozinhagourmet/direitos", destination: "/cozinhagourmet/direitos/index.html" },
      { source: "/cozinhagourmet", destination: "/cozinhagourmet/index.html" },
      { source: "/cozinhagourmet/confirmar", destination: "/cozinhagourmet/confirmar/index.html" },
      { source: "/cozinhagourmet/checkin", destination: "/cozinhagourmet/checkin/index.html" },
      { source: "/cozinhagourmet/contrato", destination: "/cozinhagourmet/contrato/index.html" },
      { source: "/cozinhagourmet/patrocinio", destination: "/cozinhagourmet/patrocinio/index.html" },
      { source: "/cozinhagourmet/trama", destination: "/cozinhagourmet/trama/index.html" },
      { source: "/cozinhagourmet/parceria", destination: "/cozinhagourmet/parceria/index.html" },
      { source: "/cozinhagourmet/episodio2", destination: "/cozinhagourmet/episodio2/index.html" },
      { source: "/cozinhagourmet/fotos", destination: "/cozinhagourmet/fotos/index.html" },
      { source: "/cozinhagourmet/contrato/admin", destination: "/cozinhagourmet/contrato/admin.html" },
      { source: "/cozinhagourmet/contrato/novo", destination: "/cozinhagourmet/contrato/novo.html" },
      { source: "/orbi/contrato", destination: "/orbi/contrato/index.html" },
      { source: "/orbi/contrato/admin", destination: "/orbi/contrato/admin.html" },
      { source: "/orbi/contrato/novo", destination: "/orbi/contrato/novo.html" },
      { source: "/isaacnewton", destination: "/isaacnewton/index.html" },
      { source: "/politica", destination: "/politica/index.html" },
      { source: "/termos", destination: "/termos/index.html" },
      { source: "/dom-barreto-7q4k", destination: "/dom-barreto-7q4k/index.html" },
    ];
    return { beforeFiles, afterFiles, fallback: [] };
  },
};

export default nextConfig;
