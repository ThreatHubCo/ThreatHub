import { withApiHandler } from "@/lib/api";
import { DeviceWithVulnerabilities } from "@/lib/entities/Device";
import { getDevicesForVulnerabilitiesFull } from "@/lib/repositories/devices";
import Joi from "joi";

const schema = Joi.object({
    vulnerabilities: Joi.array().items(Joi.number()).default([])
});

export default withApiHandler(async (req, res, session) => {
    const devices: DeviceWithVulnerabilities[] = await getDevicesForVulnerabilitiesFull(req.body.vulnerabilities);
    res.status(200).json(devices);
}, {
    methods: ["POST"],
    schema: schema,
    authRequired: true
});
