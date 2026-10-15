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
        console.log('Body recibido:', req.body);
        
        // Aceptamos diferentes nombres de variables (precio, price, monto) y ponemos un valor por defecto si llega vacío
        const precioRaw = req.body.precio || req.body.price || req.body.monto || 1000;
        const precio = Number(precioRaw);
        const cantidad = Number(req.body.cantidad || 1);
        const usuarioId = req.body.usuarioId || 'demo_user';

        if (isNaN(precio) || precio <= 0) {
            return res.status(400).json({ error: 'Precio inválido' });
        }

        const preference = new Preference(client);

        const resultado = await preference.create({
            body: {
                items: [
                    {
                        title: `${cantidad} Fichas de Truco Argentino`,
                        quantity: cantidad,
                        unit_price: precio,
                        currency_id: 'ARS'
                    }
                ],
                back_urls: {
                    success: 'https://app.netlify.com',
                    failure: 'https://app.netlify.com',
                    pending: 'https://app.netlify.com'
                },
                auto_return: 'approved',
                external_reference: usuarioId
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

        if (!fichasARetirar || !aliasCbu) {
            return res.status(400).json({ error: 'Faltan datos para procesar el retiro' });
        }

        console.log(`Solicitud de retiro de ${fichasARetirar} fichas para usuario ${usuarioId} a la cuenta/alias: ${aliasCbu}`);

        res.json({ 
            exito: true, 
            mensaje: '¡Solicitud de retiro enviada con éxito! Se procesará en las próximas 24 horas.' 
        });

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