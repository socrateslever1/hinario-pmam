# Importação de Áudios — Ordem Unida

O sistema está preparado para receber os áudios dos **toques de corneta**, **dobrados** e **vozes de comando**. Cada arquivo enviado fica armazenado no serviço de arquivos do projeto, associado a um identificador único e disponibilizado diretamente ao painel de execução.

## Formatos e organização

Envie preferencialmente arquivos **MP3**. Também são aceitos WAV, OGG, M4A, AAC, FLAC e WebM. Cada arquivo deve ter, no máximo, **100 MB**; para toques curtos, arquivos menores facilitam o envio, a reprodução e o cache offline.

Para importação assistida nesta conversa, pode ser enviado um único arquivo ZIP com os áudios. A organização abaixo reduz ambiguidades na associação:

| Grupo | Exemplo de nome recomendado |
|---|---|
| Toque de corneta | `corneta-sentido.mp3` |
| Dobrado | `dobrado-cavalaria.mp3` |
| Voz de comando | `voz-sentido.mp3` |

Os nomes dos arquivos podem ser diferentes; a associação final será conferida pelo título de cada botão antes do cadastro.

## Cadastro no sistema

O **Xerife Geral**, administradores e o comando global autorizado encontram a aba **Áudios O.U.** no **Posto de Comando**. Nessa área, cada item possui a ação **Enviar** ou **Trocar**. O envio substitui o vínculo ativo sem remover o registro de auditoria do arquivo anterior.

Após o cadastro, o botão correspondente na tela de Ordem Unida passa a tocar o arquivo. Ao acionar outro item, a reprodução anterior é interrompida antes do novo início. A opção **Baixar áudios** aparece na faixa de estado da execução quando houver arquivos cadastrados e permite preparar os áudios para funcionamento offline neste aparelho.

> A sequência formal de emprego dos toques — incluindo o início em **Sentido** e a parada obrigatória antes de uma nova ação — permanece separada da importação de áudio e será aplicada posteriormente às regras de execução.
