"use client"

import * as React from "react"
import { Building2, Mail, Phone, MapPin, Save } from "lucide-react"
import { Button } from "@/components/UI/Button"
import { Input } from "@/components/UI/input"
import { Card } from "@/components/UI/card"
import { H1, H2, P, Muted } from "@/components/UI/text/typography"

export function CompanyView() {
    return (
        <div className="space-y-6">
            <div>
                <H1 className="text-primary">
                    Company Profile
                </H1>
                <Muted className="mt-1 text-ink-secondary dark:text-gray-400">
                    Manage your organization's details and settings.
                </Muted>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Info */}
                <Card className="p-6 lg:col-span-2">
                    <H2 className="mb-4 text-primary">
                        General Information
                    </H2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-ink-primary">
                                    Company Name
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                    <Input defaultValue="BlueSky Creation" className="pl-11 rounded-full" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-ink-primary">
                                    Registration Number (ABN/ACN)
                                </label>
                                <Input defaultValue="12 345 678 901" className="rounded-full" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink-primary">
                                Industry
                            </label>
                            <select className="w-full appearance-none rounded-full border border-gray-200 bg-panel px-4 py-2.5 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary dark:border-zinc-700  dark:focus:ring-primary">
                                <option>Technology & Software</option>
                                <option>Finance</option>
                                <option>Retail</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink-primary">
                                Description
                            </label>
                            <textarea
                                className="min-h-[100px] w-full rounded-2xl border border-gray-200 bg-panel px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary dark:border-zinc-700  dark:text-white"
                                defaultValue="Leading provider of coyote-catching equipment."
                            />
                        </div>
                    </div>
                </Card>

                {/* Contact Info */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <H2 className="mb-4 text-primary">
                            Contact Details
                        </H2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-ink-primary">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                    <Input defaultValue="contact@blueskycreations.com" className="pl-11 rounded-full" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-ink-primary">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                    <Input defaultValue="+61 2 1234 5678" className="pl-11 rounded-full" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-ink-primary">
                                    Address
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                    <Input defaultValue="123 Momo St, Sydney NSW" className="pl-11 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Button className="w-full">
                        <Save className="mr-2 size-4" />
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}
