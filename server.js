const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || 'TU_ACCESS_TOKEN_DE_PRUEBA_LOCAL' 
});

app.get('/', (req, res) => {
    res.send('¡Servidor Backend de Truco Argentino funcionando con éxito!');
});

const crearPreferenciaHandler = async (req, res) => {
    try {
        console.log("=== DATOS RECIBIDOS DEL FRONTEND ===", req.body);
        
        // Obtenemos la cantidad de fichas que pide el usuario (por defecto 1)
        const cantidad = Number(req.body.cantidad || req.body.fichas || 1);
        
        // CADA FICHA VALE 1 PESO
        const PRECIO_POR_FICHA = 1; 
        
        // Si el frontend manda un precio válido lo usamos, sino multiplicamos cantidad por 1
        const precioUnitario = Number(req.body.precio || req.body.price || req.body.monto || PRECIO_POR_FICHA);
        
        const precioTotal = precioUnitario * (req.body.precio ? 1 : cantidad);

        const usuarioId = req.body.usuarioId || req.body.user || 'demo_user';

        const preference = new Preference(client);

        const resultado = await preference.create({
            body: {
                items: [
                    {
                        title: `${cantidad} Ficha(s) de Truco Argentino`,
                        quantity: 1,
                        unit_price: precioTotal > 0 ? precioTotal : cantidad * PRECIO_POR_FICHA,
                        currency_id: 'ARS'
                    }
                ],
                back_urls: {
                    success: 'https://app.netlify.com',
                    failure: 'https://app.netlify.com',
                    pending: 'https://app.netlify.com'
                },
                auto_return: 'approved',
                external_reference: String(usuarioId)
            }
        });

        res.json({ init_point: resultado.init_point });

    } catch (error) {
        console.error('Error al crear preferencia de Mercado Pago:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
};

app.post('/crear-preferencia', crearPreferenciaHandler);
app.post('/api/crear-preferencia', crearPreferenciaHandler);

const solicitarRetiroHandler = async (req, res) => {
    try {
        const { usuarioId, fichasARetirar, aliasCbu } = req.body;
        console.log(`Solicitud de retiro de ${fichasARetirar} fichas para usuario ${usuarioId} a la cuenta/alias: ${aliasCbu}`);
        res.json({ exito: true, mensaje: '¡Solicitud de retiro enviada con éxito!' });
    } catch (error) {
        console.error('Error al solicitar retiro:', error);
        res.status(500).json({ error: 'Error al procesar el retiro' });
    }
};

app.post('/solicitar-retiro', solicitarRetiroHandler);
app.post('/api/solicitar-retiro', solicitarRetiroHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Truco corriendo en el puerto ${PORT}`);
});