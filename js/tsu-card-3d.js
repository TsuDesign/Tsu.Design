/*!
 * Tsu Design Card 3D
 * Cartão NFC interativo em 3D, com a arte do cartão Tsu Design em relevo
 * (pássaro, logotipo e símbolo de aproximação), igual na frente e no verso.
 * Requer three.js r128 (global THREE).
 *
 * Uso:
 *   TsuCard.mount(document.getElementById('cartao'), {
 *     idle: true,          // flutua e balança sozinho
 *     interactive: true,   // inclina com o mouse, arrasta para girar
 *     startSide: 'front',  // 'front' | 'back'
 *     tilt: 1,             // intensidade da inclinação (0 a 2)
 *     shadow: false,       // sombra no chão (desligada por padrão)
 *     artSrc: null         // PNG do layout do cartão (caminho ou data URI). Padrão: arte embutida
 *   }).then(function (card) { card.flip(); });
 *
 * O elemento recebido precisa ter altura definida (ex.: height: 560px).
 * O fundo do canvas é transparente.
 *
 * Formato do PNG: cartão preto sobre fundo branco ou transparente. O cartão assume a
 * proporção do PNG. O preto vira vazio (o corpo do cartão já é preto), e o que sobra
 * (pássaro, texto, ondas) ganha relevo.
 */
(function (global) {
  'use strict';

  // ---------- medidas do cartão (unidades da cena) ----------
  var W = 2.0, D = 0.06, BEV = 0.012;
  var R_BIG = 0.21 * W, R_SMALL = 0.03 * W;     // cantos assimétricos
  var CW = 1024;                                // largura das texturas (a altura segue a proporção)
  var FACE_Z = D / 2 + BEV;
  var REST_Y = -0.38, REST_X = 0.1;             // pose de repouso

  // faixas verticais da arte (fração da altura), para dar profundidades diferentes
  var BAND_CRANE = [0, 0.415], BAND_TEXT = [0.415, 0.63], BAND_WIFI = [0.63, 1];

  // Arte original do cartão (PNG) embutida
  var ART_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAKfCAYAAAAYSHBsAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAEzkSURBVHhe7d0JnJxVme/xp/all+o1C4ksYQmbAsKgIyqbuIxCWMdxYREX7ugoAWb0IgICKoLKpncEZVG2gDMkoPfqKAqCCh+RxcgWFgMBAiFJ711dXfs9z5u3Qqep7q7qruquqvP7+nntqreqq6o7JM//nPcsnrwhAADAKl73KwAAsAgBAAAACxEAAACwEAEAAAALEQAAALAQAQAAAAsRAAAAsBABAAAACxEAAACwEAEAAAALEQAAALAQAQAAAAsRAAAAsBABAAAAC7EdcJ3btGmTrF+/Xl555RXn64YNGyQej0sikXjTMTo6KvxxA6i2m2++WRYvXuzeQ60iANSRP/zhD3LPPffI/fffLy+++KKsXbvWfWSLaDQqgUDAua1/rHpks1nJ5XLO13Q67TwGANX03HPPyS677OLeQ60iANSw1atXy29/+1un6N93331Oy14tXLhQfD6fc7+vr885BwC14tlnn5Vdd93VvYdaRQCoMY888ojcdtttcvvtt8vLL78sTU1N0t7e7nTf9/T00IUPoOatWbNGli5d6t5DrSIA1ICnn35abr31VqfwP//88043vt/vd67bA0C9IQDUB2YBzKFf/vKX8p73vEf23HNP+eY3v+m08JVeq6f4AwCqiQAwy3Qw3i233CJve9vb5MMf/rA89dRTEgwGna59rucDAGYLAWCWaIv+Bz/4gey8885y4oknOq19r9crvb29kkql3GcBADA7CACz4I477nBGxJ555plbp+e9+uqrzvQ8AADmAgGginSu/uGHHy7HH3+808rXa/svvfSS+ygAAHOHAFAFWux1UN8ee+whf/nLX5w5+7piHwAAtYIAUGG6Sp+O6j///POdwj80NOQM/AMAoJYQACokk8nIGWecIQcffLBs3rzZKfqFlfsAAKg1BIAK0Ov6Bx10kFx11VVOq39gYMB9BACA2kQAmKGf//zn8ta3vtVZt7+w6Q4AALWOADBN2uV/1llnybJly5x1+pPJpPsIAAC1jwAwDXpt//3vf79ceeWVzmI+LOQDAKg3BIAy6Qp+7373u53R/trdz2I+AIB6RAAog27P+453vEOefPJJrvUDAOoaAaBEur3lgQce6IQAXdEPAIB6RgAowUMPPSTvfOc7nd36uN4PAGgEBIAp/O1vf5NDDz3UGeXPSH8AQKMgAEzilVdecUb760A/neoHAECjIABMYHBwUI444gjnK8UfANBoCABF6CC/I488UtauXSuJRMI9CwBA4yAAFHHKKafIAw88wIA/AEDDIgCM89WvflVWrFjhLPULAECjIgCM8bOf/Uwuvvhiyefz7hkAABoTAcD1/PPPO13/up0vAACNjgBg6Ch/HfSn3f4s8QsAsAEBwPj85z8vzzzzDEv8AgCsYX0AuPHGG+WGG27guj8AwCpWB4ANGzbIaaedJh6Pxz0DAIAdrA4AX/jCF5xr/rT+AQC2sTYA/OpXv5KVK1dy3R8AYCUrA4Du6qdd/8Fg0D0DAIBdrAwAF154obPTH0v9AgBsZV0A0Ol+3/nOd8TrtXr4AwDActZVwbPPPlv8fj8L/gAArGZVAHj22WflzjvvdMYAAABgM6sCwAUXXCChUEhyuZx7BgAAO1kTAF588UW57bbbGPgHAIBhTQD45je/6ez0R+sfAABLAsCrr74qP/nJTxj4BwCAy4oAcM011zjL/dL6BwBgCysCwK233iqBQMC9BwAAGj4APPzww/L888/L6OioewYAADR8ANDWfzgcdu8BAADV0AFAr/vfcsstDP4DAGCchg4Av//972Xjxo1s+QsAwDgNHQC0+z8Sibj3AABAQUMHgJUrV9L6BwCgiIYNAGvWrJHe3l7JZDLuGQAAUNCwAUCv/wMAgOIaNgDce++9XP8HAGACDRsA7r77bhb/AQBgAg0ZAJ5++mnp6+tz1gEAAABv1pAB4JFHHnFvAQCAYhoyADz33HMSDAbdewAAYLyGDADPPvus+Hw+9x4AABivYXsAGAAIAMDEGjIAPPPMMwwABABgEg0XAHTzn+HhYfceAAAopuECgF7/BwAAk2u4ALBhwwb3FgAAmEjDBYB4PO7eAgAAEyEAAABgoYYMAKwBAADA5BoyAHi9DfdjAQBQUVwCAADAQgQAAAAs1HABYGRkhFUAAWAOeTwe9xZqWcMFgFwu594CAMwFGmH1gdFyAABYiAAAAICFCAAAAFiIAAAAgIUIAAAAWIgAAACAhQgAAABYiAAAAICFCAAAAFiIAAAAgIUIAAAAWIgAAACAhQgAAABYiAAAAICFCAAAAFiIAAAAgIUIAAAAWIgAAACAhQgAAABYiAAAAICFCAAAAFiIAAAAgIUIAAAAWIgAAACAhQgAAABYiAAAAICFCAAAAFiIAAAAgIUIAAAAWIgAAACAhQgAAABYiAAAAICFCAAAAFiIAAAAgIUIAAAAWIgAAACAhQgAAABYiAAAAICFCAAAAFiIAAAAgIUIAAAAWIgAAACAhQgAAABYiAAAAICFCAAAAFiIAAAAgIUIAAAAWIgAAACAhQgAAABYiAAAAICFCAAAAFiIAAAAgIUIAAAAWIgAAACAhQgAAABYiAAAAICFCAAAAFiIAAAAgIUIAAAAWIgAAACAhQgAAABYiAAAAICFCAAAAFiIAAAAgIUIAAAAWIgAAACAhQgAAABYiAAAAICFCAAAAFiIAAAAgIUIAAAAWIgAAACAhQgAAABYiAAAAICFCAAAAFiIAAAAgIUIAABqhtfLP0nAbOFvG4Ca0B6LubcAzAYCAIA5t6B7vqSzWcnlcu4ZANVGAAAwpxYtWCher0eGh4fdMwBmAwEAwJxZtHA7CQaD8urrG9wzAGYLAQDAnOju6pZEYkQ2bNrongEwmwgAAGbdgnnzpb+/TzxerwkBCfcsgNlEAAAwa3Sa3/zueRLv7ZV5Tc3SY74CmBsEAACzwu/1SVdHh0T6+yXg98umxIj7CIC5QAAAUHV+U/Db29pk0eCw9Ehe8uGwpFIp91EAc4EAAKCqdJR/W0ur7BKPy3Y+n0TM7b7+PvdRAHOFAACgakKhkDRHo/K2kRE5Kdwkj5h/cXoHB9xHAcwlAgCAqohEIhIJheUdiaRc29whX4oPyKgvIJlMxn0GgLlEAABQcU1NTc5Av0NTKfk/ze1y8siAtLe2Sf9gv/sMAHONAACgolqbmyVgvn4ikZLvRttkZTYtz/h9srmfKX9ALSEAAKiYWGtM8tmcfDqZkTNbOiQdDMnXTes/zkY/QM0hAACoiI72dsmkkrI8nZXPNrdJRzQqR/e/LuHmZomPxN1nAagVBADUte7OTmlpaXHvYa7on8NIfETOzYh8vCkm3U3NculQn/SHQrKZ1f6AmkQAQF3TbuXk6Ki0m1amtkB1zjlm1/x582RgcFC+m/PIRyJNMq+5RZ5OJ+VHqREZGGWdf6BWEQBQ17LZrHjzeYkmkxIdGRG/OdfV1iZtsdiWJ6CqdF1/Xc//R3mfvCfcJAtb25zzx/VvEm80Kgnz5wKgNhEAUNeGteh7vbK/eGSXvMjnvH7ZLTEqKXM+1tQkXe0dzmI0qLyF8+Y7K/qtkIC8LRiRxbEtxf/MwR6RaBMb/QA1jgCAuqaLyvgCQdnZhABfPi8v5XPyfq9PvuwPyoczWWnSDWdyOemMxaS9rd3ZjQ4zp9v5avG/Le+XnQIh2d78btUfkgn5f9mU9MWHnPsAahf/GqLu+QJ+ecZ8/aw/IGtMsX/ZnW62mwkCn/L45HRfQPZOpiQzEpdoOOz0CrQ0NTnPQfkWdM+TwcEBWZHzyVtM+NrR/D49Ho/z2McHNkk2GJRUOu3cB1C7CACof6b4POHePM+EgDuzaRnO590zIlHz+KEer5xlgsBxJhvEEgkZTSalozXmDBzUneowtS17+XdLfHhIbst4ZKH5fe7U3rm1+H+if6M0t7RIXz+r/QH1gACAupdJZ+X1XNa9J/Jdf1B+mCm+1exOplidaMLAV0zx2t+0UrMjIxIMBKTbtGJjTCeckBZ/3cs/GR+RW9N56fb5ZefOrq3Ff2ViWB4zNzdT/IG6QQBA3RseGRaPKVAb3FZ/xBSlc/0B+ckEIUDpwMGDxCNneP3yybxHOkZHJZ5IONvWdppCx3TCN2gPSWdbu2TN7+iWZFY6vQHZpbNbvG7xHzW/938b7JGEuc9qf0D9IACg7mnRCQWC8pS80e2/o2nlL/P65BfZqXee284Uro+ZMPA1f1AO0iVrRxKmuJkWb3u7tLdtGdluK+0diZlQ5E2n5aZERmLmd7qrafkXir9a1v+6tLbEZHBo0D0DoB4QANAQvKaV+viYoqT+0RSrXUxh/1MJIcBhvv8fTIY43RT/z5rvXZBMSTwedza36erslEgo4j7RDqFgSJqbmiRsQtFPRlLS4vHJbl3ztplJcXV8UNab331PH1P+gHpDAEBD8JjW//NjBv4VHOPziS5F89SYMQKl6DTH8eblzvEF5fCciC8xKrl8VjpjbU53eKNPJwyHwhIJh0WXU7ounpSo+adit+5u8Y35udebYHXJyKAMplOSG9P7AqA+EADQEFKZjPRP0NL/vM8vj+Vy8uo0rk/nPSL7mGDxr6a+fdEflB3M+wzrdMJIxBkU19zU7D6zcTSZny0YDMh8r0+uHhqVsIlXS7vnid/cH2tZ/0YJNjc5YycA1B8CABrCyMiI+Exrf517f7yL/AG5NZuWZJFeglI1m+89KpeXc3wBOdL81fElk5JMJaUjFpPO9s6GmE6ogUZ7N3Y1v6/vD41IUIt/1zwJmN/tWBcM9UkyHGajH6COEQDQEJyBgKZo/XXcOICxLjMt+KsnmRlQKu1HWGre71/Njf/tD8vSbE5GEnEJBYPOdMI2dz38etPa2ir5fE4OCITk4v5h8ZuspMU/OC7YrDah55ZUQnp1lUUAdYsAgIahKwI+7pm4hd9qwsGZpvV+S6Zyq9T5TBz4gAkA53j8coI5gumUMy2x3RTTro7OuplO2B5rk3QqJYeEonL2wLD5ubzOgL9QkV6NEwY2Sj4SdhZTAlC/CABoHKb2vzjFdf5dvV75gDn+p9SZASXKmDffMZeVz2ZycmEwIm/LeyRhWsg6aE57BWp5OqGuezAympCPRJtlef+g+UfB4wz4iwQC7jPe8IXBzRJoapbevj73DIB6RQBAw0ib1veorkE/yWUA9W6vTxaZ//T/nC1vZkBJzHun8jk5NJORczxe+VQgJFEdOBiPOysNdnd0SSRSO9MJuzu7ZHBoSE5qapXP9ek8flP8Tcs/Gnhzz8XvRkfkXhOcNjPfH2gIBAA0DB2NHvD7ZY0pvFM5weeVQdNqf7bM6YHlSOVF5pni/6l0Rr4Visg7xSejpojqeAVdZKjTHHM5nXCeaeX3DfTLF1vb5J/7BpweFF3kp2mCyxYnDmySpD/g7MAIoP4RANAwtqwIGJBHJu8A2OqLPr88YL5nk2mxV5XHI/FsVv4xk5av5b3yxWBU2s39oXhcmiJR0wrvlObm2Z1OqDv66aY958c65UO9A6KTI3R535ZQ2H3Gtv65f6PEWmPSP8ha/0CjIACgoXhNUf9biQFAXWpatNeawpydwfTAciRMM7s5k5JPprJyaSAih5n3T48mJZVMyeIFC9xnVdd8Lf6DA3JxS7u8s7fPKf47d3RKa7h48b89MSxPm9/p5n6u+wONhACAxmIK1SZT0INTjAMo0Lb/lYGQ/KiCMwNKoQsM9ecysl8qJeeYO5+LNsvrPT3OIjzVNL9rnrNm/2XRVtmnr98p/rqlb1sk6j5jW0O5nPz7UK9zuYSNfoDGQgBAQ0mOpiSVTsvouFXrJqPj8z9vWuL/NcshoCCez8ke5jNHAkGJhKsXAOZ3dTtTFL8fbpHd+rd0++/Y3iEd0eLFXx3Tv1GiLa0yPDzsngHQKAgAaCjxRFwCppg/VmIPQMFS8/xDfH75bYWnB5ZKxyH8gwkA6SqEEB1oOK+zS0YSI3J1oEl2GNhS/N+i+xpEm9xnvdlV8QHZFPDL5t4e9wyARkIAQMPRgYAPlVf/He8xIaDb45VH5igEfCSbd2Yy6HTBStH1+3XzonQqKT/2R2XB4Jbiv6g1JvOaJ36fF00QuTIxJD2pma+cCKA2EQDQcDw+nzxvWtQBHRBQpn8xreUN5uvaObjenTTBIxYOi9//5gV4pkP3JojFWiWfyci13pB0usV/gQkYC1pa3WcVp13/vqYmSYyy0Q/QqAgAaDh5879e04INlTEOoMDUR/myLyC/zWWkT6vlLBo17364x+9sMKSr8c2ELkHc2twsgVxervcEpHVw0Cn+3U3NpvU/+aqE5wz1STYSkR42+gEaGgEADSeVSkk6nZb+cTvYlSprCvFV/pD8ZwU2DirXu3I55/PHYtNfOlj38o+Gw9Lk8cj1eb9E3OLfFW2S7dva3WcV94gJHyvTo7JpJO6eAdCoCABoOLo1cDAQkD/5pt+K1rX9rwpE5MezHAIGcllZZIq3d5ofvbCXf5c/INdlvRIY2lL82835qYq/0gV/0ub7NYQAaGwEADSkoCmAq03lm844gIJ2ycnnfEFZNYvTA/Wiw/vzXkkkR50BfOVoMi18j9crbwmG5BrdEmFoyCn+sXDEmevvmWJmxGkDmyXa0ix9AwPuGQCNjACAhuT1eeUFU7jDM1xrf6mpmf/oC8h9szgzYMdsVnK5vDOAr1R6vV+r/Z6RqPxgNCO54S3FvyUUclb5m6r4/89oXB7IZ2UjxR+wBgEADUmX9+83ASAwjYGA4x1mameTxyurq7hx0FhJMYU8EJCcVvAStLXGJJ3JyD80Nct3RtKSjo84xb85GHLW95+q+KuTTet/xOeXTDV2SARQkwgAaEjJdNIpii/7Zx4AdELgKT6fvGCq6kuzND3wMFPARxIJCZkW/GQ62tolMToqh7fE5MKRlCRHRpzzTYGgs7Oft4Tif1z/Ruky389GP4BdCABoSFo8g6YIPiAe8c9wSp3KmOJ/gT8kP89mZKjElvlMtJigEfR6pWWSlfq6OzplKD4sx8Xa5SvxpIy6xT/iD8iuXd0lbTV808iQ/N3rkY19TPkDbEMAQMMKBvzyRC4jkRmOAyhI5LPy42BErq7QzIC/mDCxdoKxBRoxDvRql3zxx7tN61539Ptse6d8Pj4qCbf4h/1+2a27W3wl/Mw9uaycO9wvvTrmwHlHADYhAKBheb0+edEU0HAFxgEUJE0IuCzUJD+ZYQi4O5ORB00BfjSbk5vTKXm8yLX3d+dyztLAzTrAb4x5psD3m+L/tY558vHhUWfaowr5TPHvmlfy7IFj+zdKyLx2nDn/gJUIAGhYuXxOBjJp0xquXABQsVxGTvaH5RcTtM6n8rIp7LpU8cdzHrks65EzzMsMmwDwvXRS/phNy7B7iUEvXHQEAs6qfgW6l//A4KB8o61L3jc8srX4B3w+WWoe06+l+F68XwbM626m6x+wFgEADUu3Bs6alvazpij63XOVsrfkZR/T4v5TmSEga4r7LabIp833H+KOJ9zVlPqzTBC4KeOR/YNRudE8/ktz6IDDd5u/ohl3UR7dzndwaEguae2Ug+KJrcVfxwosNS3/Uov/dSOD8p8jQzKgUyUAWIsAgIaVSCac1rPOb49UuBdAlwv+iMf89THHk2VMD9Tif1ogLLuZv3qt4wYnLo5G5cuxTnl63vbyv5o75AlzbkMmLSOjo7Jw3nwZHonL5c1tckD8jZa/z7z/rqblH/JPHnHWmte5YLBXdnv9Jfm/QwPO9+lcwXnz5rnPAGAbAgAami4J/KQJAM2+QEVmA4yVMi3oL/mD8oQppK+WMD3w99mMHOrxyXPm+w4t8vSFLTH3lsiySJP8qms7+XZbt3wwGJae3h55n/nruiAe31r8dYqfDvgLT7J74H8lhuUjPa/JP/dskGR8WK7JiJxtjivNcdRoWvr7+qSro0PaY1MvEwygsRAA0NA8pqX7YmbLQMC3hKKywB+SdAX/s4/nMnJFMCK3mZb96CTTA58zAUGnEp4QCMlvMik5JLftczsikaKFfE/z/J+2z5e/z3uL7Gtu/2smId/y5+UJk2V0wF808Mb4gIK/pZPyHwObZdHr6+Tng31yvCn0Wvg/YH7ujQGfPBz2y/NBn+zi98lF3oDsEU/I6OiILDBhIhKKuK8CoNERANBQtMtfp8g1NzVLa0uLpDNpGUgl5XujcfmROb6eHJGz06PyVxMMWnyV6RPoM8X/p5HmCacHxk3h/615zr+ZAv9nycthHp95323fecGY1n8xUfN5v9TcJk/M215OjXXJynBA/mlos9w8MuQ8njTvcYO5fejm9fJvfRslNjIiKzMe+UImL11+rzwW8svfzLHRFP3smMWBEl6PfMDcv8QEhNDgkPhNQFjQPb+kNQQA1Df+lqOhtLW2SiIxIgcHAvJO8cmBeY90m2L7VDYlvzIF+mHTYr88K/JkclS+ZYLBwkBEOitweSBlgsa3gk1yi/k63g3mfc/3ByViivjd5vFDx3UUtIUjEjGft1QfDkflro4FcnVrlzxqXluv6++88SV5cGhA/jWZlcvNR3in+av9fNBvWvsBeSHgdwr9RDImAPSawn+hCQtfTKRkaKDPWV64q6PLfQaARkQAQMNobmqSgaEhOcUUyH9MpuRdptiG02l5i2l1t5j/1N9pCvDxpth/w5uXi8ItcoIJCB8Y6ZeHTOtZLw/M94edIu0spF8m/Y55+azTxf+rMTMDfmU+w4k+v3SYIpv3+uUJ89j+ptCOtZ0pttOxRyAowVxOPmBe7q6MV07J5sVvWvjaxf+0ae33+rySH9Pan5R53gsmMGzn9ckdKZFD4yMyZAKFzjzQLYYBNB4CABpGOBiUTtOa3m00KVqCXzTFcY0pyuG8RzpNiX6b3y87er0SMsdNI4NyVEtMHm/tlnuTCflaYkiiPp8sCEZksQkDrdO4PJAx7/EP5uuuptD/OZuVJ8z7d5nC+g5TVPW1/pTLyPvMY2O1hU3oKKP1P9YnezZIIJEwhd8jG02xf8S09teblnyq1KJfxGa/V54I+uRT6bzcmhbpMIHKaz79gu55JlxUejIlgLlEAEBD6OzokIHhYTnTtOp78zlnMZ1V2bTsZlr0AVOYDxgzwO6fzO3/4xN5pnezRExRu7V7OznCfN/Bw73yYCYlAfM9nf6Q7BCMSqcvWNblgaQu8GNeM2O+5c+mta+tf9VsQsBvinT/jx35X45DN70iByZTcnTOI6+Yov18oHJ/lYdNmFgdNj+1CRJXJnPytdGMpAb6nR6WeV1cFgAaBQEAdU8HrGXSaXl7U7Mz919dYwr5uz0+GTat8IOKjK4/2rTEv+HNyd97e5z7n+6aL4/H5sl/JUfk4tFh55wWwFbzvc7lgYB7eaAEg6bw65S/S8a877D5LBpMdsu8sWZALBSW6JhV/koRz2Wda/6npXLyrrxHnjUt/pfMoV34lZQ2r/dEyC+bfB7Zz4SW21Iiy+IJ6e3vl3mdXdIybnliAPWHAIC619ne7mz9e2wq44xwv9EU/3eYgrvZFNzDx0yTC+Xy8tZkRgL5vOzuM+HAPPd32bSs7e11rvt3hCNyZ/ci2U988qHhXlltHiuImha8c3nAHFNdHrjIvP85vsDWrXgD5uu9uYwcYc6NHV5Q7rX/Z1JJ2cO0/K/OiCwxn0CLv3bZV0vOfO7ngn550X2PT5j3/UXGI7sMDomY37cuSzx2mWIA9YUAgLoWCYUkPjLiDO5LmIKvS+jON8Vxo7n9oTEt8NZsTt6eycmwaXXvltrSCj/SPH6JLy+DyVFZPzjgnPOaVv6/dc6T+9rmy9WjcbnSHGMVLg9sH4w60wjHu820/Pc1z9l9zDQ6fd5v0kk5zLTYC1rM5y6n9X93Ii6f7HtdVmW8EjKF+XHTOu+pYvEf61UTNJ4O+pxxFTqa4evpvFw6mhX/wIA0m59jPqsJAnWJAIC6pl3RMdM639m0SB/OZk0IyJuWf16O1+KvLXBze3E6K3t4/PLl5rD8qyctG0NBWZgxBcw8/iHzvd/15mTD8JD0uivsqe1MUPhN92LZ3hTz4+J98pwp7GNp6z4wrh/g0VxW1pv3O3JcMFhvCn/EPH+B+YwF25Vx7f+6oX65fKDHtPw9EjdvudoU/5FJpvVVQ5/P64SOEfdtdzY/+w2pvJwSH5X+3l5WEwTqEAEAdas9FpM+0wr9TF7kRVN4/2YKcI/5erIp/tp97TO39zDF/+VIWI7zZuQl8z2x5hb5j1xKFue2XBLQDX3WmWK62pOXdf09MuJuvKN0DMB/dMyT/451yTdGh+Xa5BsBQenKfgVD5vaPTEg4a0yvg4p6vXJ3NuV0/+eyW9b/bTEtf205l+K8/k1y//CgXJT1yJD5PHpdfuxCPrNJ1xLQENA/Jnx8MOeRX2S8sv9QXDKJuHNZQHtlANQ+AgDqlq6mt084LKO5nPx3Ni2DkpfTfUFnYZuwKe57Z0UubArJJamENEebZWBoUF7b+LpEo01yesQvS9OmRW4Kt14KuNibF12d9/nezZIetzf/rqGo/Kl7sbMa30nxflnvbv6Tyb+xoP/XM2n5+rjir1q8AflNOiXvkzc2I1pQ4rX/U3tek9GRhHzJFNnNpug+Edp2Fb+5oO//VNAnr/m2/RxnpfPyg1ReYv0DEjWhSoMAqwkCtY2/oahL2uWcGE3IkZmcM+Jfx/6fZ4qttlI7TEs77vHJx305ec3rE5/fLxt7NknOBAWliwW9bgr//w2HZHEmK82mqL3T55OrvTmn+K81ISA/pnXvMM85r71bfhjrkjMSQ7LChAqd96+uNsX/aF1DwASEsfTeEyYk7Goei7rd/02m9d8aCju3J6Lv/YGNr8ieybR8NO+RV31eedYU3ZIX9ak28zl00SAdhDh2T6OFJpD9wASBz4+mJdHfJ/NaWp0/JwC1iQCAuqML0owmk/IRr9/ZO1/H6l8ifhk0xX8HU9CvDgXku+astvp7TSGKx7cdyKf7A+hr3Kg9AyYgRE3T/0DTan3U/G143hT14VRKXjLfV8w+oYg8Ou8toq94Xjopv8xmRNv97zGvM16L+Xy68c/7/SHJmvdU25miOBkNKftsfFk+ns7JIab4rw145UVT/Cs9za8SdAbCk+azjd8B4T0mFfx32iOHDI/IiAlbrCYI1CYCAOpOe2ubNJlW/sum+G8yreWLxCcJU4ySppB/3puX1/1ajD2yybTkJ6JjB9pjbXKaX2S3TE48hUsBvi2t+s0jcdkwtGVmQDHfbp8n57Z2yJ25rCyZoDjrFsQaAA4zL6kdCrriX2t44kL4gu5NsOllZ2Oe3c3n15H3G5yfpXYNuYsGDRf5FZyaFfmpyT2L+wdERwXoJkOsJgjUDvPv3vi+zvp20kknyYoVKyQzZsQ1GkdTpEmyuYwcZP6rfdgU36/mvOIN+ORWr1eekZxEo1HZ3LNlcZ+p6BK3bW0x2dkEgM+PpmSdeZ0/mJb64kxePuFM2cvLLp3dEpukaKsv9m2U59NJ+aLP78z5VyHz6k+bz/R7E1K+mjet5GTSvFanea2o8/h4940My2cGe5xLGVosdZydTrnT3oWAue18de9rCd1yzn288Jg55zzm3n/jee7j5mvhcR3gWEl+88/IXsmsNE3wz4kOsvyuefNcJCKeUEg2btrkPoJGtGbNGlm6dKl7D7WKAIC60tXeIZ2mdb4+m5UvZz2y2RTtH+Vz0tTcLMPmfNIU2nJE3K7p5aZId5lAoS3aH5pifmnG41zT9plCuXv3PAkX2Xd/rN+OxuWUgc1ymtcn7zRBoMsXlIvSo3JUICRvGxmVsM8ne85b4D57WzcO9slPRgblO1mvDJlCuTpgWtQmAegYA71wkDZ/Q52v7n39L3vLOffxwmPmnPOYe/+N57mPm6+Fx7VfYUswGBMOSgwaQfNaTeZ1W50jL7GcOcxtDS5jj7B57nh3ePNygznaYm2SSI7K0PCWVRfRWAgA9YEAgLqhK/4NDg05ZeXfsyJ3m0L5lN8rYdOi7Okrfs2+FF3tnTIYH5IVeb88aSrjyyZQ/MH893OVKcgq7Pc7IcBX5Dr/eJ/ue136Mmk5L9wix4z0y/9EYjJsPvOSjk5pj7y59f/Nvo3y+GhC/iPndebYPxXyz2gzn1LpFMYtwWBMOCgSFvR5ennE5BJncKIeOgdCY9bWw3zcbe6POR8036fRSYc9Bs3Ppb/RARNudK8GnSWg4wM2bNooqTHTL1H/CAD1gQCAuqDFoiMalcHRUTkkJ3K/zyPNzS2mcA9XpHjo3veBZEIuTWbl7wGf/M4U8X1MRTzKuRRgWromZOza2a195879ydyVGJYvDPbIPwfC8hlT8tLJlOyzcJH76BtO2/yqhNJpOdkU/z5TFHWk/1xO89N1E5pMa15b9836NZeT6DT+ddAfIe/zS18wIPf5vPKgafG/kMvKqPlZ9e9lwAQqDVNenwlUJmwNj4xsnaGBxkAAqA8MAkRd6NDWvyn+beb2n8MhiTQ1y+a+3oq1HPsH+2XEhIwV4aCzbPDh/oDc6MvLkGkNq8FkcutywVNZFmmWfwk3yQLzeqaOSkgL3Rha7D6y8WXZPpVxiv/rJszogL/ZLP5a7PXn3C6dk93M53j7aFreMZqRvVNZ2SmdlW7zWKnF32OK/HA4LA80R+WStmY5qTUix5hm/ydTcbkhnZC1um6C+V0E3QGACfPnqJdrBocGZXB4mOIPzBECAGpeOBiWgYEBZ855tqVV4qmk9E0wTW+6tGWaN63936ZGTa3yOQVymdcv33JnBajxywVPptcUtZh4zOumJWBawwW6zsCBm16RZZm8fNC838t+r/w9aB6vYvGfrNjvmMlKVzYv4VKLvSnkqWBQnm6KynWtUTmtrUmOifjlX3KjcrEp9n/RNRnMawX8QdPK9zvFXtdd6Dd/flrs9fcMoDYQAFDzmpqanOlj0UhUekyrv1pFZHB4UGKtrXKOZGRJJic7m5a71+uR3+kFcNf45YIn0mdavW0er2ndmuLqtnxfTiZkiSn+XzMff19T/J8L+ORlc1SSjsaPmYK+nWnFL51hsVe5gF9ej0bkDlPs/3csIsc1BeR4T1r+3bTuf2nCTV8+5wScQCDgDMDUIt8/OOD0qIyaMAWgdhEAUNNirTGJhMOSNEVXu4yrbdPmzRI2QePCcEDaTav5w6Yle5kuE+xeCtAu/WLLBY/XYwpjzLTqtbzPa26RP5pwcXjfRrk9u2V2gS6gs2mGu/kVK/YHmmK/l7m9owkwnWUWe+3KHwoF5XfNUflWLCofbw3LMf68fMoU+5vTKVlr3s9vQlEgEJS8ee2hkbjTsu8b6H/TYksAah8BADUtOZqQV15bP6vXiePxEVlv3u9Jv88psseaoqd7BRRMuFzwGH3m+1vM4zu2d8h/D/fLV4b7ZEXW61zn1938dLphOSpe7D0io8Gg/DUalu+b1v1nTLE/OuSVf8mOylWZUXksl5Ws1ysh8xyf+fnjiRHTqh+U3v5+GRoekkyOrnyg3hEAUNNG52B6mHZdB4IBud58fUvOI3v4/NLr9cifx1wK0OWCXx6YeByCdo0v9gfk6viA/Gxk2JlSqEsV/80U/6T5Ohkt9m3ZnCzSYp/MyP4zLPYqE/DLC+GQ3NQSkeWm2B8bDcrxkpJzs0m5zxTzIR2kZ1r2AVPwC9ft+0yx1xZ+uWsrAKgPTAMEJtDd2SWZREK+ZQrxy6bFfmU6JavctQEKtm9rk+6mFvfeFnHT+t970ytypC8gSfM9n8ttKf66i55uUzyWFvstU+62fG0290Mz/BuZN8W8L+CTB03L/WGfyJOSd4JU1nwubdEHTDDxmM+jf0eG43FG4aPimAZYH+gBACagAw5NtZSbQkFTmEWOMAX1Su+2xfLl/j4ZTm472E2v//tM0W1LpZ3ir70HWvx1aV9t2S82gWL3MS37PVNZ2UFb9iYAlF38tSvffMY/RUNyeXNYTmrRrnyPfNK07K/NZ+RJ87jX55dwOOysaqgFX6/Z9/b1OYsqUfwBexEAgAlocUyZIv5oJiVxj1f29frkOfM35gl3QKDKmwr8994eSY3pcerNZUU3wV2W9zir5qn9TMH/B1Pwtdhvb4p9x3SKvZHxe+XxSFCuNcX+35pDzhS84/IpuTSXlgc9eUn5fc7KiKFAaMx1+z6nK38uLqcAqF0EAGASWkSbm5rku7mULDDV/CP+oHx7zNoAKmOCwt97N0nOtPyVrgEwX5vmhs4CmG6xz3m98kowIKtM6/5sU/CPawrK0d6cfNUU+/+RnGw2Lf+QKfbhUMSZJdFvWvTastdr9/EEo/IBTI4xAEAJujo6JZxMyhdN6/0+08JvyWbl07lt83N7JCJLOrrkvxPD8pXBHmnxeCRigoCug69fm00miHq8EjW3nS2IvB7pNUW+XQf1mcdC5nzIfP2LedmnTZgYMP8Nb71uH9Dr9l7JZrKSGIlv0+MA1BrGANQHegCAEgwODsmgKegP+n1yoM8nD5q/OS+OuRSg+hIJeW1wwOkB2N0U+mN8ATnMPPcAr092NcW703y/33zPUD4rr5jjj5mU3GPCxC8CHrnNJ3KDad1f4/fIavPcjCn6URModPlc57q9adX39vbKgHl9ij+ASiAAACVImWKtI+f/X2rUWSP/Iz6/XDzuUoB6dWhQnk0nTWvfIx3mWGCCwPamoO9ijj1NENjHHAea79X7m8yRNS393qEhGRgeliFT6AcHB6XPFHnd3VDn3MdNqACAaiAAACUaMMW5vTUmF3lysqP5q7PEFPCfjVkboOApDQnuGICJ3JzNSKCpyZlzDwBzgQAAlGFjz2YJhiNys98r7zUt+bt8edk07lKADr+LTFL/f26Kf4vuZtjb654BgNlHAADKNDKakL/nc/KaKfLLilwKGDGBYKIegL/ncrLO55We+LB7BgDmBgEAKJN22+vCOtemU7LU43V2/fvlmEsBI+ZmdIIegNuyackGApJKp90zADA3CADANPT09kp7rE0uNX+D3u/3y7XevGyIhOTJkE8Sknem/Y13qyn+ba0xZ3EeAJhrBABgmnSp4LQ/IPd7vfLPJgR8PjMq381lnNX/mrY8ZSvdXa8/EJSe/ok3EAKA2UQAAKZJlwrOmML+R9Oy/61p8IeammUwGBSvCQPrxqyvNWJu/8Y8b9TjZe19ADWDAADMwPDwsLS0tMhmr1dGkylnLn8w2iR/yhd2ARC5OZeR5paYDA7T9Q+gdhAAgBnatHmztMViW9ffj8dH5FXztd+0/P+QzUgqEpFNvZudxwCgVhAAgAp49bXX3FsiiWRCwtEmudcU/4c8JhCwCx+AGkQAAKogncnKWq9Hwi0tkmA5XwA1iAAAVIFe7491dDmXBwCgFhEAgCp55bX17i0AqD0EAAAALEQAAADAQgQAAAAsRAAAAMBCBAAAACxEAAAAwEIEAAAALEQAAADAQgQAAAAsRAAAAMBCBAAAACxEAAAAwEIEAAAALEQAAADAQgQAAAAsRAAAAMBCBAAAACxEAAAAwEIEAAAALEQAAADAQgQAAAAsRAAAAMBCBAAAACxEAAAAwEIEAAAALEQAAADAQp684d5uCCeddJKsWLFCMpmMewb1Yvny5e6t2vHaa6/J7bff7t4DUIo1a9bI0qVL3XuoVQQAzLlVq1bJsmXL3Hu1R/9bOvHEEwkCQIkIAPWBSwCYU+9+97truvgrv98vl112mXsPABoDAQBz6pRTTnFv1baFCxe6twCgMRAAMKf2228/99bE+vv75dFHH5X77rtv6zGTSzzPPffcNq+lr51IJNxHJ/bRj37UvQUA9Y8AgDm1++67u7feTIvzTjvtJB0dHXLAAQfIoYceuvUYHh52n1W+H/7wh9u8lr52U1OTnHnmmU7YmMgRRxzh3gKA+kcAwJyKRCLurTfouNSPfexjTnFet26de7b6rrjiCids3HXXXe6Zbb33ve91bwFA/SMAYM5MNO3vrLPOmtMR98ccc4y8+uqr7r03LFq0yL0FAPWPAIA5s/fee7u33qCFV1vic+2ggw5yeiLGKtZbAQD1igCAObNkyRL31hZacLXw1gK99PDzn//cvQcAjYcAgDkzvsBeeumls3rNfyp6KUBnDBSUMlMAAOoFAQBzRrv6deT9nXfe6QywO/vss91HaoeuZqYDEvUz7rnnnu5ZAKh/BADMKQ0Bxx57rPzxj390z9QeHZCon7GWeicAYKYIAAAAWIgAAACAhdgNEHWpt7dX2tra3Hvl0XEH1ZpqqJsb6cqCBx98sMRiMeecjiPQKYQvvPCCDAwMOOfWrl0rTzzxhLMTYiUvLeywww7O4EV11FFHOV8Lgy1n8l6Fn0uNf91amLaJ2sJugHVCA0AjOfHEE/N+v19DDUcDHyYA5HO53LSO5cuXF33N6R6mOOYfeeSRfDweL/p+Ux3ZbDa/fv36/LXXXps3Bbzoe0x06Hubwl7y70Ofp99T7LXGHvqce+65p+TX1c9f7mfnaNzDBAD3X2TUMi4BANOkre1nn31W7r//fmdTo+kuFOTxeJzdBk899VSnl0BfU1vck9FVFLUXRN9bt1MutTdEn/frX//avfdmY1/3kEMOKfl19fM/8MAD7j0A9YAAAEyDFkrtxt9ll13cMxMbu/ugrnQ41eUpfU0twNdee617Zlu6K+Fll1027UsgGlSK7Ww409fVEDBVcAFQOwgAQJm0+Guh1Jb7ZLTQ6xoCei20sPPg4sWLJRgMynXXXfempYbH0x6Be+65x733Bi20M3Xaaae5t95Qid0OTznlFPcWgFpHAADKoN3+3/ve99x7k9O1DSba1Oizn/2sfPzjH5+yN0C74ce3qnXQnfYm6NbFU4WIcnzmM5+Z8euOX94ZQO0iAABluOGGG6Zs+RcUZgFMRMPBiSeeOGWx1d0Rx9PeBN26WGcbVFLhdYu9J4DGQgAAyrDvvvu6t6amz9XLBZPREKChYjKTBYlqraDI1D6g8REAgDKUM0BOewp0rMBUo/q16/366693770ZuxICqAYCAFBlhVH9GgQuvvhi9+y2NAToAkV6/b1ALw1oMKA1DqAaCABAGWaywqQGga985SuSzWaLhgEt9Hr9faeddnJmD/h8PicYAEA1EACAMjz++OPurenTSwOFMJDL5WT9+vXbzPnX5Xonmj0AAJVCAADKcPrpp7u3KqewCmChZ4DFdADMBgIAUAYddT/ZgL2ZKPQMFMYL6JoDAFAtBACgTIUFc6pJg4AuNTzVNEIAmC4CADANumBOtXoCCgrTCCfaEwAAZoIAAExTYepeIpFwz1SHjg+gJwBApREAgBnQqXtNTU1y5513VnRd/vG++c1vurcajw561F4O3fiocOh9xkAA1UUAAMqkhUlb5HoUitSxxx7rbISjYwNmslbARCbawrdaZqPHQX93jzzyiDPoUXs5dOOjwqH3dQxEsd0QAVQGAQAog7ZMX3jhBefavB56W+fxazHT+fs6NqCw3W+lLw1UYrvegqn2NDjqqKPcW9Whv6+nnnpK9ttvP/fMm+kYCA0DOiMCQOURAIASaatYW6bj6Tx+LWaF3gCl2/3qpQEdI/Dcc8+5Z2dmtrba1Z+j2msR6AZI2qtRCp0RMdESygCmjwAAlEi37p2IFrMHHnjAvfcGHSOwdOlSee9731uxIFAJk+0wqMXZ7/e796qj3IBx0kknubcAVAoBACjRggUL3FvFaU/ARNfOdQGhmQaBSu4KqN3rq1atcu+9QVva2u1eTdrDUG7A0N8tgMoiAAAleuihh9xbE7v00kvdW8UVgsAll1xS9qyBYgVbjd1BsBzLli1zBuEVBjTqtXbdn6DajjnmGPcWgLlEAIB15s+f794qz/e+970pi7a2bEsZtHb22WeXtZrga6+95gwyLEYHIk6XDsIrDGjUa+0F053SONmlhYKJggyA2UUAQN3R6XBtbW3uvfJ96Utfcm+VR1vvpXTDayEtZfqaTnMrhRbjyaYATtXrMB06DmA6IeCtb32re2vLdf5ig/c0yJQ7VXK6vRwAJmH+kjeUE088MW9aYfovF0eDHTvssEPeFNZ8Lpeb8RGPx/OmQBV9n6mOhx9+uOhrjj96e3vzy5cvL/oaeqxfv77o940/rr322qLfP/Z49tlni37vdA7TQnde85FHHin6+FSH/m71Z9fb2Wz2TZ9Vj3L/HEv5HXDUzrFmzRr3X2TUMgIAR90cWliKFYfpHlqcphsCTMs2n0qlir7u+EOfpwVai54WMv1aKJCTHfr5TMu/6PuPPzQcVeL3M7bQ6muW+jNOdOjPOvZzjn3tUj+v/q6KvQZH7R4EgPpAAOCom0MLYrECMZNjshZ6KcePf/zjqgSTe++91ymSxd5zokOf/8orrxR9zakOLbLFwpAGkOn+fM8888ykP0Mpn1d7W8r9PXDM/UEAqA8EAI66ObTVrYWqUocW2WLvM51DC6UWq5mEAS2GGihmWvD0s2jxnar1ro/r76CUXpBSg46GF/05yglW+nn1c+hn1j8X/bpy5cpp985wzP1BAKgPHv0/8wfWMHTBkBUrVlRlPXagFKaAO1PsdEBcYWT9dtttJ93d3c7Av6GhIeec0hHxr7/+utx+++3umcoqfJbxrrrqKvdWeUxRlre//e1vmsr34IMPyurVq6v2c6C+mADgTHdFbSMAAAAqigBQH5gGCACAhQgAAABYiAAAAICFGAOAuqRr2A8MDLj33qxw/fGZZ56Ra665pqzBabq/v35fuXSA32c+8xn33rZ0MN65557rbAb0yiuvbN2PP5FISDwelyeffNJZalhXG5zIR93VAEv9WXTA3llnnSV77bWXc7+rq8v5WnjPO+64w1mSeCr6vkccccSEP1uprr32Wrn77rsZKGgBxgDUCQ0AjYRpgHYcOl2s2Pnxh04x0yll+nydRljsOeOPUl+71EMXw9FV9Sab1qaP6fS3iRbO0UOn1pUyvU6nEer76bTEid5Tfy/6uK5GONnn0kPfU6cA6vcUe7zUQ3+2ma67wFEfB9MA6wOXANDQtLV57LHHSkdHh/NVew5mkyl6zv4B+++//6St+8Iugfpc/Z7p0p4GbWXr/gAHHHDAhO+pvxd9/F3vepdzu9C7MBGdNvjDH/7QeX0AjYEAAGtogX3sscdK2q2vErQLXl1xxRXO11Locw877DD3Xnn0/R544AGnu77UbnbdmGfRokXOboCTFXddq+Coo45yfn8AGgMBAFbR69h6Db7YLnWVduGFF8p5553n3qs+Lfraop9o2+DJ6Pdpz8FktDdBf6bZClAAqosAAOtoC1sHi1abDvSbrNu/knSA3Y033jit4q/0+0499VT33sS0h0IHLOr7AahvBABY6Ve/+lXVewF0tP1s+dCHPlTSiP7JlBpWdBng97znPVOOGwBQ2wgAsNJFF10kxx13nHuvOjZs2DArg+Y0yGigmU3vf//7GRQI1DkCAKw03a7yctx0001yww03uPeqR4uxBprZpL8/BgUC9Y0AAGvpYMBq0uvlujiQTj2sdkt5NgLNeAwKBOobAQBWW758uXurOnTWgc7JX7lypRMEdPBcYXpgpey0007urdnHoECgfhEAYC1tnRcTi8Wkt7e3rGMyOj1PFwLSY+PGjU53vbaaNRCsWrWq7gfTMSgQqE8EAFhryZIl7q1t6R4DunJgOUepvvrVr8qhhx4qu+22mxMIbrvtNqdwahjQFQAr3TswEW2xFwsy012FkEGBQP0hAMBqr732mntrbmjvgC5RrGFAFw267rrrnF6BcrzwwgvurdLppYmZBJnxGBQI1B8CAKylSwOXumTubNBBdfqZenp6ym6J10LLuzAocLb3WwAwPQQAoMZo67ycrVR/85vfOFsN1wIdFPjSSy8xKBCoAwQAWEkXz3nooYfce7XnmWeeKXlQna4AqJcRaoUOCtxvv/0YFAjUOAIArHTaaadVfQrgTOgMhYULF7r3pqbTDMsdO1BNGkim2mEQwNwiAMA6Wijvu+++OVk8p1Q6Q6GcAYp62WCvvfaaUau7kt32+rvVz6LbEwOoTQQAWEW7/rfffnunm7qatHdhJgV1OgMUjzjiCGeNgem0uqtxzV4HBeoOhQwKBGoTAQDW0CJXmHJXbToYbuedd57WvHrtofjOd77j3iudtro1BOhUvFIvb2hYKBRo7UWoNB2foOsqMCgQqD0EADQ0LXBafHTlvU2bNpU1un6mdMGfa665xnnvUgqgLgKkz9VpgBogpkNDgA7AW7ZsmfNaE10SKPxetItelyquRvEvOOyww+S9733vrP7uAUzNkzfc2w3hpJNOkhUrVkgmk3HPoBHpqnWT0b34dTve5uZmueOOO5wV+EqVzWadVut0TLSYjrbIdaEcXWZ4/GvrOaXF+4wzzphwbEKhVV9qONBAoZcEFi1aJF1dXfLXv/5VFi9e7Dw2NDQkv/71r9/0e9EeCy3YY5X7vsVo4HjqqafknHPOmdHroD6sWbOGwFcHCAAAgIoiANQHLgEAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAFBj9t13X/cWAFSPJ2+4txvCSSedJCtWrJBMJuOeAWrDjjvu6BwHH3ywc/+QQw6RtrY22WeffZz7k7nvvvucr7///e9l3bp18uKLLzq3gVq0Zs0aWbp0qXsPtYoAAFSJFnct8lrwjz76aNlhhx3cRypn9erVcuedd8pdd90lf/3rX92zwNwiANQHAgBQQVr0tdiffvrpJbXsK2lgYMAJAz/96U/pHcCcIgDUB8YAABWg1+1vuOEGeeGFF+T666+f9eKvYrGYnHzyyXLPPfc4n2P58uVOIAGAYggAwAxoF/+9994rjz76qFN8tQjXAr3ccNlll0lvb69cfvnlBAEAb8IlAGAatPCff/75Wwf0lUsH8emh1+21676g0HVfGDCoNFRoD8PYc+XS97jiiivkyiuvlP7+fvcsUB1cAqgPBACgDFqAtau/3MKvhV1H8he+zoSGAX1/vcygQaScUKBB4IILLnDCAFAtBIA6oQGgkZx44ol5v9+voYaDo6LH8uXL8319fflcLlfSsXLlyvzJJ5+cb2trK/p6lTpMAMhfdtll+bVr1xb9HMWOe++91/m+Yq/HwTHTwwQA919k1DICAAfHFIcWSi2YxQrp+KO3tzd//vnnz1lx3XffffPXX3990c82/tAwo5+12OtwcMzkIADUBwIAB8ckx9FHH11Sq19b39raL/Yac3FoANHiroGk2Ocde6xatarqvRQcdh0EgPrALABgAjp6fuXKlZOO7NcBdXpN/e1vf7sz/75W6ABD/VxLliyRn/zkJ+7Z4pYtWyaPPfYYSxADliEAAOPolDmd2qeL+UxGF93RAquFtlZH1uvnOvXUU52AMtniQDptUKcynnLKKe4ZAI2OAACMUSj+k43y19b1YYcdJscee2zdTKnT6Yb6mTWsTEYXMSIEAHYgAACuQvGfbBU/bfVP1ZquZYXLFZPtG6AhQC9/AGhsBADAtWrVqgmLf6ErvZ5a/RMp9AZomJmIXv7QhY4ANC4CAGBot/dE3f5a8LVgTjWYrhK0F0IX96k2/Zk0zEx2SUADwI7TXHkQQO0jAADGRAP+tLU8VZd5uXS0vW7Uo93sesmhr69Pcrmcc+ja/bqZT+G+Hrqxjz5PC7IGlUoWZQ0A2rMxEd3ZEECDcqcDNgzWAeCYzlFsvvyjjz5asfnxup7ADTfcUNZKgpMdjz32WEUXHDLBouj76OqHxZ7PwTHZwToA9YEAwMFhjvEFsBLFX4uzaeVXrOhPdNx7773O5y/2Gco5NKSMDUK6uFGlAhCHXQcBoD6wGRDg0q513dJXp/nNZFEffR3trtfXmk3r1q1zuvRnMlZBxyDowkD6VX8H9T7gEXPDBAA2A6oDBACgQrRo1sLoeQ0Cn/rUp+p2qiLqHwGgPhAAgArQkfu6TbCuqFcOHVyoPQ6rV692z2zZOnjsTACdmqgDB8sd/HfXXXc5QYBWPGYbAaBOaABoJIwB4JjtQwfjjb0mP9mhYwt0696DDz646GtNduj1+GXLlpW19a+OP9Br+8Vej4OjWgdjAOoDAYCDY5qHFmQdjV+s8I49dGCdbtGrW/UWe53pHhoG7rnnnqLvOf7QwYjFXoODoxoHAaA+sA4AMA3aJa/z8ydbNli73nVQnm4YpHPtK7mWgNIufl2gSF9/quv9OjZB1xLQcQoAoAgAQJl0MR7dOW+ybYILewZoAKj2NfjC5kR66O2J6EqHhAAABQQAoAza8tfNciZSWGJXj8mKcTVoL4CGjsmmAWqPhYYAACAAAGWYbIpfYdngyTbZqTYNIHq5QY+Jeh40BGgvBgC7EQCAMkzUfa5Ff6ou+NmkvQD6eSYKAeVOVwTQeAgAQBmKFfgrrriiJrcJ1h4JHSBYbPDhTFY6BNAYCABAGc4444yt19i1sGor+8wzz3Tu1yINJfoZ9TPrbQ0wczE+AUDtYSVAAEBFsRJgfaAHAJhDuuSvDizUkfl9fX2Sy+W2Ho899pisWrVKli9fXvYywAAwFXoAgFmmxVwX5tGR+JOtJTCe7hdw5ZVXzmi3P2A20ANQH+gBAGaJFn7dMGjt2rVOACin+CudvqdrEOgKhEzjAzBTBACgynTq4OWXX+4U/pNPPtk9O306hU+DgF420IWJAGA6CABAFWmB1kKtLf5KKyztS28AgOlgDABQJdrlrwP5Sunq12l5etx3333OfS3uSgcJlkJX/mNsAGoFYwDqhAaARsJ2wBy1cpjWedGteQuH7ul/+umn501QKPr9hUO3/dXthIu9xtij0tsNc3BM92A74PrAJQCgSgqt+PF0QR5dUEhX6dNR/VMtyqPb/moLXxf0mWzbXxMU3FsAMDUCAFAlxZYGLqweqIW/XFr89Xt16eFi1q1b594CgKkRAIAqGV/ktXBrAS+2Nn85dOnh8bv96WsyBgBAORgECFSRTvvTaYDajV/p9ff1dbXbX4OAvj5QKxgEWB8IAACAiiIA1AcuAQAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgIQIAAAAWIgAAAGAhAgAAABYiAAAAYCECAAAAFiIAAABgoYYMAPl83r0FAJhtfr/fvYVaRg8AAKCimpub3VuoZQQAAEBFEQDqAwEAAFBRTU1N7i3UMgIAAKBiwuGwewu1jgAAAKiYaDTq3kKtIwAAACqG7v/6QQAAAFRMS0uLewu1jgAAAKgIj8cjixcvdu+h1hEAAAAVEQgEZNddd3XvodYRAAAAFZFOpwkAdYQAAACoCF2GfZdddnHvodYRAAAAFUMPQP0gAAAAKsLn88nOO+/s3kOtIwAAACpi++23d0IA6gMBAAAwY7oA0P777+/eQz0gAAAAZiyRSMghhxzi3kM9IAAAAGYsl8vJoYce6t5DPSAAAABmxO/3S3t7u+y5557uGdQDAgAAYEaam5vlfe97n3sP9YIAAACYkeHhYbr/6xABAAAwI5lMhgGAdYgAAACYNu3+1+V/99hjD/cM6gUBAAAwbalUSj7xiU+491BPCAAAgGnTAPDJT37SvYd6QgAAAExLLBaTAw88kB0A6xQBAAAwLTr6n9Z//SIAAADKVtj0hwBQvwgAAICyhUIhOeGEE5wVAFGfCAAAgLJ4PB4ZGRmRc845xz2DekQAAACURbf+/fCHPyx77723ewb1iAAAACiZtv518N/Xv/519wzqFQEAAFCy1tZWOfjgg+WAAw5wz6BeEQAAACUbGBiQs88+272HekYAAACUREf+H3744fKBD3zAPYN6RgAAAExJ5/3ncjn50Y9+5J5BvSMAAACmlM/n5ctf/rIsWbLEPYN6RwAAAEwqGo3KokWL5Nxzz3XPoBEQAAAAk9JFf66++mpnDAAaBwEAADAhLfrLli2Tf/qnf3LPoFEQAAAARQUCAWfe/zXXXOOeQSMhAAAA3kRX/Mtms7Jq1SqZP3++exaNhAAAAHgTHfX/jW98Qw466CD3DBoNAQAAsA2/3y8f/OAHWfGvwREAAABbafFfuHChrFixwj2DRkUAAAA49Lq/+sUvfiFtbW3ObTQuAgAAYKtbb71V9tlnH/ceGhkBAADg+P73vy8nnHCCew+NjgAAAJDzzjtPvvCFL7j3YAMCAABYTK/7f/rTn5YLLrjAPQNbEAAAwFJa/I899li2+LUUAQAALPWxj31Mbr/9dvF6KQU24k8dACykXf633HKL+Hw+9wxsQwAAAEtol78W/JtvvtkZ9Ae7EQAAwAJa+CORiPzud7+TT3ziE+5Z2IwAAAANTrf17erqkoceekgOPvhg9yxsRwAAgAamLf8DDzxQHn/8cdlrr73cswABAAAall7zP/fcc+X++++X7u5u9yywBQEAABqMtvpjsZjce++9cv755zPND0XxXwUANBAt/rqZz5o1a7jej0kRAACgAehAv9bWVvnP//xP+ctf/iILFixwHwGKIwAAQB3TFr8ep556qrz00kvyuc99ji5/lIT/SgCgTgWDQdlzzz1l9erVcvXVVzvX/YFSEQAAoM6Ew2GZP3++3HjjjfK3v/2N6X2YFgIAANQBndIXjUZlxx13lCuvvFLWrVsnH/3oR91HgfIRAACghun1/VAoJLvvvrv89Kc/lbVr1zrX+fUcMBMEAACoMTqITwu8fj3yyCPlj3/8ozz11FNy/PHHOz0BQCUQAACgRuhUPqXz+L/1rW/J+vXrZdWqVXLAAQc454FKargAQDoGUC90d76Ct771rc4WvdrF/+ijj8qZZ57JXH5UFT0AADALCoP4/H6/c3/hwoWybNky+dnPfiY9PT3OaP6vfe1rstNOOzmPA9XmyRvu7YZw8skny0033SQN9mMBqCM6cC+bzbr3RBYtWiR77LGHLF26VPbff3854ogjZPHixe6jwNxouADw7W9/W26//XYCAICq0kV4tAu/qanJadnr1+bmZmcxns7OTqfgL1myxBm9D9SihgsAAABgaowBAADAQgQAAAAsRAAAAMBCBAAAACxEAAAAwEIEAAAALEQAAADAQgQAAAAsRAAAAMBCBAAAACxEAAAAwEIEAAAALEQAAADAQgQAAAAsRAAAAMBCBAAAACxEAAAAwEIEAAAALEQAAADAOiL/H29e4lkJxu7eAAAAAElFTkSuQmCC';

  // ---------- utilidades ----------
  function cv(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var im = new Image();
      im.onload = function () { resolve(im); };
      im.onerror = function () { reject(new Error('Não foi possível carregar a arte do cartão')); };
      im.src = src;
    });
  }

  // ---------- arte (canvas 2D) ----------
  function isBg(p, i) {
    return p[i + 3] < 16 || (p[i] > 238 && p[i + 1] > 238 && p[i + 2] > 238);
  }

  // Recorta o cartão, separa o fundo externo e transforma o preto em vazio.
  function processArt(img) {
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var t = cv(iw, ih), tx = t.getContext('2d');
    tx.drawImage(img, 0, 0);
    var fp = tx.getImageData(0, 0, iw, ih).data;
    var x, y, k;

    // 1) caixa do cartão (tudo que não é fundo branco/transparente)
    var x0 = iw, y0 = ih, x1 = -1, y1 = -1;
    for (y = 0; y < ih; y++) {
      for (x = 0; x < iw; x++) {
        if (!isBg(fp, (y * iw + x) * 4)) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) { x0 = 0; y0 = 0; x1 = iw - 1; y1 = ih - 1; }
    var w = x1 - x0 + 1, h = y1 - y0 + 1;

    var cc = cv(w, h), cx = cc.getContext('2d');
    var out = cx.createImageData(w, h), p = out.data;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var s = ((y + y0) * iw + (x + x0)) * 4, d = (y * w + x) * 4;
        p[d] = fp[s]; p[d + 1] = fp[s + 1]; p[d + 2] = fp[s + 2]; p[d + 3] = fp[s + 3];
      }
    }

    // 2) fundo externo = região de fundo ligada às bordas (o texto branco dentro do cartão não é atingido)
    var bg = new Uint8Array(w * h), stack = [];
    function seed(sx, sy) {
      var q = sy * w + sx;
      if (!bg[q] && isBg(p, q * 4)) { bg[q] = 1; stack.push(q); }
    }
    for (x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
    for (y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
    while (stack.length) {
      k = stack.pop();
      x = k % w; y = (k - x) / w;
      if (x > 0) seed(x - 1, y);
      if (x < w - 1) seed(x + 1, y);
      if (y > 0) seed(x, y - 1);
      if (y < h - 1) seed(x, y + 1);
    }
    // engrossa o fundo para eliminar o contorno suavizado do cartão (sem linhas claras ao redor)
    var grow = Math.max(4, Math.round(w * 0.008));
    for (var it = 0; it < grow; it++) {
      var nb = bg.slice();
      for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
          k = y * w + x;
          if (bg[k]) continue;
          if ((x > 0 && bg[k - 1]) || (x < w - 1 && bg[k + 1]) || (y > 0 && bg[k - w]) || (y < h - 1 && bg[k + w])) nb[k] = 1;
        }
      }
      bg = nb;
    }
    // limpa também uma margem junto às bordas do recorte, onde o contorno do cartão fica cinza claro
    var margin = Math.max(4, Math.round(w * 0.012));
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        if (x < margin || x >= w - margin || y < margin || y >= h - margin) bg[y * w + x] = 1;
      }
    }

    // 3) preto vira vazio; o resto mantém a cor original
    for (k = 0; k < w * h; k++) {
      var i = k * 4;
      if (bg[k]) { p[i + 3] = 0; continue; }
      var m = Math.max(p[i], p[i + 1], p[i + 2]);
      p[i + 3] = Math.round(p[i + 3] * clamp((m - 10) / 34, 0, 1));
    }
    cx.putImageData(out, 0, 0);
    return { canvas: cc, w: w, h: h };
  }

  // Uma faixa vertical da arte, na resolução da textura
  function makeBand(art, CH, band) {
    var c = cv(CW, CH), x = c.getContext('2d');
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';
    var f0 = band[0], f1 = band[1];
    x.drawImage(art.canvas, 0, f0 * art.h, art.w, (f1 - f0) * art.h, 0, f0 * CH, CW, (f1 - f0) * CH);
    return c;
  }

  // ---------- geometria ----------
  function cardShape(H) {
    var s = new THREE.Shape();
    var x = -W / 2, y = -H / 2;
    var bl = R_SMALL, tr = R_SMALL, tl = R_BIG, br = R_BIG;
    s.moveTo(x + bl, y);
    s.lineTo(x + W - br, y);
    s.absarc(x + W - br, y + br, br, -Math.PI / 2, 0, false);
    s.lineTo(x + W, y + H - tr);
    s.absarc(x + W - tr, y + H - tr, tr, 0, Math.PI / 2, false);
    s.lineTo(x + tl, y + H);
    s.absarc(x + tl, y + H - tl, tl, Math.PI / 2, Math.PI, false);
    s.lineTo(x, y + bl);
    s.absarc(x + bl, y + bl, bl, Math.PI, Math.PI * 1.5, false);
    return s;
  }

  // Ambiente de estúdio procedural para os reflexos
  function buildEnvironment(renderer) {
    var pm = new THREE.PMREMGenerator(renderer);
    var sc = new THREE.Scene();
    sc.background = new THREE.Color(0x0c0c10);
    function panel(w, h, x, y, z, color, k) {
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide })
      );
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      sc.add(m);
    }
    panel(14, 3, 0, 9, 3, 0xffffff, 5);       // softbox superior
    panel(3, 12, -9, 1, 4, 0xdfe6ff, 3);      // faixa esquerda
    panel(3, 10, 9, 0, -2, 0xff6b5a, 3);      // reflexo avermelhado à direita
    panel(10, 3, 0, -6, 6, 0xffffff, 0.8);    // rebatedor do chão
    panel(8, 8, 0, 2, -10, 0xffffff, 0.6);    // fundo
    var rt = pm.fromScene(sc, 0.04);
    pm.dispose();
    sc.traverse(function (o) {
      if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); }
    });
    return rt;
  }

  // ---------- montagem ----------
  function mount(host, options) {
    if (!global.THREE) return Promise.reject(new Error('three.js r128 não encontrado'));
    var o = Object.assign({
      idle: true, interactive: true, startSide: 'front', tilt: 1, shadow: false, artSrc: null
    }, options || {});
    return loadImage(o.artSrc || ART_DATA_URI).then(function (img) {
      return build(host, o, processArt(img));
    });
  }

  function build(host, o, art) {
    var H = W * art.h / art.w;                       // altura segue a proporção do PNG
    var CH = Math.round(CW * art.h / art.w);
    var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var idleOn = o.idle && !reduce;

    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    var el = renderer.domElement;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'Cartão Tsu Design em 3D. Arraste para girar.');
    el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;' +
      (o.interactive ? 'cursor:grab;' : '');
    host.appendChild(el);

    var scene = new THREE.Scene();
    var envRT = buildEnvironment(renderer);
    scene.environment = envRT.texture;

    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x20202a, 0.35));
    var key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(-3, 4, 6);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0xff4d4d, 1.1);
    rim.position.set(5, 1, -4);
    scene.add(rim);

    var disposables = [];
    var maxAniso = renderer.capabilities.getMaxAnisotropy();
    function tex(canvas) {
      var t = new THREE.CanvasTexture(canvas);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = maxAniso;
      disposables.push(t);
      return t;
    }
    function keep(x) { disposables.push(x); return x; }

    var pivot = new THREE.Group();
    pivot.rotation.order = 'YXZ';
    scene.add(pivot);

    // corpo
    var geo = keep(new THREE.ExtrudeGeometry(cardShape(H), {
      depth: D, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelOffset: -BEV,
      bevelSegments: 5, curveSegments: 64
    }));
    geo.translate(0, 0, -D / 2);
    // Preto total: faces e laterais foscas, sem reflexo claro e sem contorno branco ao redor.
    // O ExtrudeGeometry usa o grupo 0 para as faces (frente e verso) e o grupo 1 para as laterais.
    var faceMat = keep(new THREE.MeshStandardMaterial({
      color: 0x010101, roughness: 0.9, metalness: 0, envMapIntensity: 0.04
    }));
    var sideMat = keep(new THREE.MeshStandardMaterial({
      color: 0x020203, roughness: 0.75, metalness: 0, envMapIntensity: 0.08
    }));
    pivot.add(new THREE.Mesh(geo, [faceMat, sideMat]));

    var front = new THREE.Group();
    front.position.z = FACE_Z + 0.0015;
    pivot.add(front);
    var back = new THREE.Group();
    back.rotation.y = Math.PI;
    back.position.z = -(FACE_Z + 0.0015);
    pivot.add(back);

    var planeGeo = keep(new THREE.PlaneGeometry(W, H));

    // empilha camadas para dar volume (extrusão) a uma arte
    function stack(group, texture, cfg) {
      var sideMat = keep(new THREE.MeshStandardMaterial({
        map: texture, alphaTest: 0.5, roughness: cfg.roughness, metalness: cfg.metalness, color: cfg.side
      }));
      var topMat = keep(new THREE.MeshStandardMaterial({
        map: texture, alphaTest: 0.5, roughness: cfg.roughness, metalness: cfg.metalness, color: 0xffffff,
        emissive: new THREE.Color(0xffffff), emissiveMap: texture, emissiveIntensity: cfg.glow,
        toneMapped: false // mantém as cores fiéis ao original
      }));
      for (var i = 0; i < cfg.n; i++) {
        var m = new THREE.Mesh(planeGeo, i === cfg.n - 1 ? topMat : sideMat);
        m.position.z = i * cfg.gap;
        group.add(m);
      }
    }

    var layers = [
      { tex: tex(makeBand(art, CH, BAND_CRANE)), cfg: { n: 6, gap: 0.0030, side: 0x6a6a6a, roughness: 0.35, metalness: 0.2, glow: 0.22 } },
      { tex: tex(makeBand(art, CH, BAND_TEXT)),  cfg: { n: 8, gap: 0.0028, side: 0x9a9a9a, roughness: 0.42, metalness: 0.1, glow: 0.3 } },
      { tex: tex(makeBand(art, CH, BAND_WIFI)),  cfg: { n: 5, gap: 0.0026, side: 0xb0b0b0, roughness: 0.42, metalness: 0.1, glow: 0.3 } }
    ];
    [front, back].forEach(function (g) {
      layers.forEach(function (l) { stack(g, l.tex, l.cfg); });
    });

    // sombra
    var shadow = null;
    if (o.shadow) {
      var sc = cv(256, 256), sx = sc.getContext('2d');
      var g = sx.createRadialGradient(128, 128, 4, 128, 128, 126);
      g.addColorStop(0, 'rgba(0,0,0,0.55)');
      g.addColorStop(0.5, 'rgba(0,0,0,0.22)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      sx.fillStyle = g; sx.fillRect(0, 0, 256, 256);
      var st = new THREE.CanvasTexture(sc);
      disposables.push(st);
      var shGeo = keep(new THREE.PlaneGeometry(3.4, 2.2));
      var shMat = keep(new THREE.MeshBasicMaterial({ map: st, transparent: true, depthWrite: false, toneMapped: false }));
      shadow = new THREE.Mesh(shGeo, shMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -H / 2 - 0.55;
      scene.add(shadow);
    }

    // ---------- câmera e tamanho ----------
    function resize() {
      var w = host.clientWidth || 1, h = host.clientHeight || 1;
      renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      var t = Math.tan(camera.fov * Math.PI / 360);
      var d = Math.max((H * 1.42) / (2 * t), (W * 1.55) / (2 * t * camera.aspect));
      camera.position.set(0, -0.15, d);
      camera.lookAt(0, -0.15, 0);
      camera.updateProjectionMatrix();
    }
    resize();
    var ro = new ResizeObserver(resize);
    ro.observe(host);

    // ---------- estado e interação ----------
    var st8 = {
      base: o.startSide === 'back' ? Math.PI : 0,
      dragX: 0, dragY: 0, hx: 0, hy: 0, hoverT: 0,
      dragging: false, lx: 0, ly: 0
    };
    var cur = { x: REST_X, y: st8.base + REST_Y - (reduce ? 0 : 0.9) };
    var hoverW = 0, time = 0, last = performance.now(), raf = 0;

    function onDown(e) {
      st8.dragging = true; st8.lx = e.clientX; st8.ly = e.clientY;
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      el.style.cursor = 'grabbing';
    }
    function onMove(e) {
      var r = host.getBoundingClientRect();
      if (st8.dragging) {
        st8.dragY += (e.clientX - st8.lx) * 0.010;
        st8.dragX = clamp(st8.dragX + (e.clientY - st8.ly) * 0.006, -0.5, 0.5);
        st8.lx = e.clientX; st8.ly = e.clientY;
      } else if (e.pointerType === 'mouse') {
        st8.hx = (e.clientX - r.left) / r.width - 0.5;
        st8.hy = (e.clientY - r.top) / r.height - 0.5;
        st8.hoverT = 1;
      }
    }
    function onUp() {
      if (!st8.dragging) return;
      st8.dragging = false;
      st8.base = Math.round((st8.base + st8.dragY) / Math.PI) * Math.PI;
      st8.dragY = 0; st8.dragX = 0;
      el.style.cursor = 'grab';
    }
    function onLeave() { st8.hoverT = 0; }

    if (o.interactive) {
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
      el.addEventListener('pointerleave', onLeave);
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now; time += dt;
      hoverW += (st8.hoverT - hoverW) * (1 - Math.exp(-dt * 5));

      var idle = idleOn ? 1 : 0;
      var iy = Math.sin(time * 0.7) * 0.22 * idle * (1 - hoverW);
      var ix = Math.sin(time * 0.9 + 1) * 0.05 * idle * (1 - hoverW);
      var ty = st8.base + st8.dragY + REST_Y + st8.hx * 0.9 * o.tilt * hoverW + iy;
      var tx = REST_X + st8.dragX + st8.hy * 0.5 * o.tilt * hoverW + ix;
      var k = 1 - Math.exp(-dt * 7);
      cur.y += (ty - cur.y) * k;
      cur.x += (tx - cur.x) * k;
      pivot.rotation.set(cur.x, cur.y, 0);

      var fl = idle ? Math.sin(time * 1.1) * 0.045 : 0;
      pivot.position.y = fl;
      if (shadow) {
        shadow.material.opacity = clamp(0.95 - fl * 3, 0, 1);
        var sk = 1 - fl * 0.8;
        shadow.scale.set(sk, sk, 1);
      }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);

    // pausa quando o cartão sai da tela
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      else if (!entries[0].isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(host);

    return {
      flip: function () { st8.base += Math.PI; },
      destroy: function () {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        io.disconnect(); ro.disconnect();
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
        el.removeEventListener('pointerleave', onLeave);
        disposables.forEach(function (d) { if (d && d.dispose) d.dispose(); });
        envRT.dispose();
        renderer.dispose();
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    };
  }

  global.TsuCard = { mount: mount };
})(window);

