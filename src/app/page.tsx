'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Добре дошли в Механик Сервиз</h1>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <p className="text-lg mb-4">
            Това е приложение за управление на клиенти и сервизни записи. Тук можете да:
          </p>

          <ul className="space-y-2 text-left mb-6">
            <li className="flex items-center">
              <span className="text-blue-500 mr-2">•</span>
              Добавяте нови клиенти и техните автомобили
            </li>
            <li className="flex items-center">
              <span className="text-blue-500 mr-2">•</span>
              Проследявате извършените ремонти
            </li>
            <li className="flex items-center">
              <span className="text-blue-500 mr-2">•</span>
              Поддържате история на сервизните услуги
            </li>
          </ul>

          <div className="flex justify-center space-x-4">
            <Link
              href="/clients"
              className="bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600"
            >
              Вижте клиентите
            </Link>
            <Link
              href="/client-form"
              className="p-4 bg-white rounded-lg shadow hover:shadow-md flex items-center space-x-4 border-l-4 border-blue-500"
            >
              Добавете клиент
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
